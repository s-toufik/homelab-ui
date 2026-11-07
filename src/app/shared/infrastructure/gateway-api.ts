import { Injectable, inject } from '@angular/core';
import { GatewaySession } from './gateway-session';

export class GatewayApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = 'GatewayApiError';
  }
}

export interface GatewayRequest {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  contentType?: string;
  accept?: string;
  signal?: AbortSignal;
  timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;

@Injectable({ providedIn: 'root' })
export class GatewayApi {
  private readonly session = inject(GatewaySession);

  async json<T>(url: string, request: GatewayRequest = {}): Promise<T> {
    const response = await this.send(url, request);
    if (response.status === 204) return undefined as T;
    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }

  async text(url: string, request: GatewayRequest = {}): Promise<string> {
    return (await this.send(url, request)).text();
  }

  async send(url: string, request: GatewayRequest = {}): Promise<Response> {
    const headers: Record<string, string> = {
      'X-Homelab-Request': '1',
      Accept: request.accept ?? 'application/json',
    };
    let body: BodyInit | undefined;
    if (request.body !== undefined) {
      const contentType = request.contentType ?? 'application/json';
      headers['Content-Type'] = contentType;
      body =
        typeof request.body === 'string' && contentType !== 'application/json'
          ? request.body
          : JSON.stringify(request.body);
    }

    const signals = [AbortSignal.timeout(request.timeoutMs ?? DEFAULT_TIMEOUT_MS)];
    if (request.signal) signals.push(request.signal);

    const response = await fetch(url, {
      method: request.method ?? 'GET',
      headers,
      body,
      signal: AbortSignal.any(signals),
    });

    if (response.status === 401 && this.session.enabled) {
      this.session.signIn();
      throw new GatewayApiError(401, 'Your session has ended. Signing in again…');
    }
    if (!response.ok) {
      throw new GatewayApiError(response.status, await errorMessage(response));
    }
    return response;
  }
}

async function errorMessage(response: Response): Promise<string> {
  const text = await response.text().catch(() => '');
  try {
    const body = JSON.parse(text) as { message?: string; error?: string };
    const detail = body.message ?? body.error;
    if (detail) return `${response.status}: ${detail}`;
  } catch {
    if (text && text.length < 300) return `${response.status}: ${text.trim()}`;
  }
  return `The server answered ${response.status}.`;
}
