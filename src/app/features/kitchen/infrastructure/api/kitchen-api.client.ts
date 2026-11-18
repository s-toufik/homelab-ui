import { Injectable, inject } from '@angular/core';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import KITCHEN from '../kitchen.json';

const TIMEOUT_MS = 6000;

export class StaleVersionError extends Error {}
export class NotFoundError extends Error {}

@Injectable({ providedIn: 'root' })
export class KitchenApiClient {
  private readonly server = inject(HomelabServer);

  async get<T>(path: string): Promise<T> {
    return this.request<T>(path);
  }

  async post<T>(path: string, body: unknown): Promise<T> {
    return this.request<T>(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  }

  private async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(this.server.api(KITCHEN, path), {
        ...init,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new Error(`Can't reach the kitchen service at ${this.server.api(KITCHEN)}`);
    }

    if (response.status === 404) {
      throw new NotFoundError(await detail(response, 'Not found'));
    }
    if (response.status === 409) {
      throw new StaleVersionError(await detail(response, 'Someone saved a newer version'));
    }
    if (!response.ok) {
      throw new Error(await detail(response, `The kitchen service answered ${response.status}`));
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
}

async function detail(response: Response, fallback: string): Promise<string> {
  return response
    .json()
    .then((body: { detail?: string }) => body?.detail ?? fallback)
    .catch(() => fallback);
}
