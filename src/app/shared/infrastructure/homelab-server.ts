import { Injectable, InjectionToken, inject } from '@angular/core';
import server from './homelab-server.json';

export interface ServiceAddress {
  port: number | null;
  subpath: string | null;
  healthPath?: string | null;
}

export const HOMELAB_SERVER_URL = new InjectionToken<string>('HOMELAB_SERVER_URL', {
  factory: () => server.url,
});

const TIMEOUT_MS = 4000;

@Injectable({ providedIn: 'root' })
export class HomelabServer {
  private readonly serverUrl = inject(HOMELAB_SERVER_URL).replace(/\/+$/, '');

  readonly host = new URL(this.serverUrl).hostname;

  url(address: ServiceAddress, path = ''): string {
    const origin = address.port === null ? this.serverUrl : `${this.serverUrl}:${address.port}`;
    const subpath = address.subpath ? `/${address.subpath.replace(/^\/+|\/+$/g, '')}` : '';
    return `${origin}${subpath}${path}`;
  }

  async isReachable(address: ServiceAddress): Promise<boolean> {
    try {
      await fetch(this.url(address, address.healthPath ?? ''), {
        mode: 'no-cors',
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return true;
    } catch {
      return false;
    }
  }
}
