import { Injectable, InjectionToken, inject, isDevMode } from '@angular/core';
import { ConnectionSettingsStorage } from './connection-settings.storage';
import server from './homelab-server.json';

export interface ServiceAddress {
  key?: string;
  port: number | null;
  subpath: string | null;
  healthPath?: string | null;
  api?: string | null;
}

export type ApiRouting = 'gateway' | 'direct';

export const API_ROUTING = new InjectionToken<ApiRouting>('API_ROUTING', {
  factory: () => (isDevMode() ? 'direct' : 'gateway'),
});

export const HOMELAB_SERVER_URL = new InjectionToken<string>('HOMELAB_SERVER_URL', {
  factory: () => {
    const saved = inject(ConnectionSettingsStorage).read().host;
    if (saved) return saved;
    if (inject(API_ROUTING) === 'gateway') return `${location.protocol}//${location.hostname}`;
    return server.url;
  },
});

const TIMEOUT_MS = 4000;

@Injectable({ providedIn: 'root' })
export class HomelabServer {
  private readonly serverUrl = inject(HOMELAB_SERVER_URL).replace(/\/+$/, '');
  private readonly overrides = inject(ConnectionSettingsStorage).read().overrides;
  private readonly routing = inject(API_ROUTING);

  readonly host = new URL(this.serverUrl).hostname;

  private resolve(address: ServiceAddress): ServiceAddress {
    const override = address.key ? this.overrides[address.key] : undefined;
    if (!override) return address;
    return {
      ...address,
      port: override.port !== undefined ? override.port : address.port,
      subpath: override.subpath !== undefined ? override.subpath : address.subpath,
    };
  }

  url(address: ServiceAddress, path = ''): string {
    const resolved = this.resolve(address);
    const origin = resolved.port === null ? this.serverUrl : `${this.serverUrl}:${resolved.port}`;
    const subpath = resolved.subpath ? `/${resolved.subpath.replace(/^\/+|\/+$/g, '')}` : '';
    return `${origin}${subpath}${path}`;
  }

  api(address: ServiceAddress, path = ''): string {
    if (this.routing === 'gateway' && address.api) return `${address.api}${path}`;
    return this.url(address, path);
  }

  async isReachable(address: ServiceAddress): Promise<boolean> {
    if (this.routing === 'gateway' && address.key) {
      try {
        const response = await fetch(`/api/health/${address.key}`, {
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        return response.ok;
      } catch {
        return false;
      }
    }

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
