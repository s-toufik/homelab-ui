import { Injectable, signal } from '@angular/core';

const STORAGE_KEY = 'homelab-ui.agent.api-base-url';

/** Relative default: works out of the box via proxy.conf.json in dev, and
 * in production as long as whatever serves this app also forwards /api to
 * the orchestrator. Point it at the container directly instead (e.g.
 * http://homelab:8000) and it works too -- CORS is wide open there. */
const DEFAULT_BASE_URL = '/api';

@Injectable({ providedIn: 'root' })
export class ApiConfigService {
  readonly baseUrl = signal(this.readStoredBaseUrl());

  setBaseUrl(url: string): void {
    const normalized = url.trim().replace(/\/+$/, '') || DEFAULT_BASE_URL;
    this.baseUrl.set(normalized);
    try {
      localStorage.setItem(STORAGE_KEY, normalized);
    } catch {
      // localStorage unavailable (private mode, etc.) -- the value still
      // holds for the rest of this session, it just won't persist.
    }
  }

  private readStoredBaseUrl(): string {
    try {
      return localStorage.getItem(STORAGE_KEY) || DEFAULT_BASE_URL;
    } catch {
      return DEFAULT_BASE_URL;
    }
  }
}
