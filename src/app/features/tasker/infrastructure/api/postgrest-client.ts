import { Injectable, inject } from '@angular/core';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import TASKER_API from '../tasker-api.json';

const TIMEOUT_MS = 6000;

@Injectable({ providedIn: 'root' })
export class PostgrestClient {
  private readonly server = inject(HomelabServer);

  get baseUrl(): string {
    return this.server.api(TASKER_API);
  }

  async request<T>(path: string, init: RequestInit = {}): Promise<T> {
    let response: Response;
    try {
      response = await fetch(this.server.api(TASKER_API, path), {
        ...init,
        headers: { 'Content-Type': 'application/json', ...init.headers },
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
    } catch {
      throw new Error(`Can't reach the Tasker database at ${this.baseUrl}`);
    }

    if (response.status === 401) {
      throw new Error('Your sign-in has ended. Reload the page to sign in again.');
    }

    if (!response.ok) {
      const detail = await response
        .json()
        .then((body: { message?: string }) => body?.message)
        .catch(() => null);
      throw new Error(
        detail ? `Database error: ${detail}` : `The Tasker database answered ${response.status}`,
      );
    }

    const text = await response.text();
    return (text ? JSON.parse(text) : undefined) as T;
  }
}
