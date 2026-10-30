import { Injectable, InjectionToken, inject } from '@angular/core';
import {
  DEFAULT_CONNECTION_SETTINGS,
  type ConnectionSettings,
  type ServiceOverrides,
} from './connection-settings';

const STORAGE_KEY = 'homelab-ui.connection-settings';

export const CONNECTION_SETTINGS_STORAGE = new InjectionToken<Storage | null>(
  'CONNECTION_SETTINGS_STORAGE',
  {
    factory: () => {
      try {
        return globalThis.localStorage ?? null;
      } catch {
        return null;
      }
    },
  },
);

function readOverrides(saved: unknown): ServiceOverrides {
  if (typeof saved !== 'object' || saved === null) return {};
  const overrides: Record<string, { port?: number | null; subpath?: string | null }> = {};
  for (const [key, value] of Object.entries(saved as Record<string, unknown>)) {
    if (typeof value !== 'object' || value === null) continue;
    const { port, subpath } = value as { port?: unknown; subpath?: unknown };
    const entry: { port?: number | null; subpath?: string | null } = {};
    if (typeof port === 'number' || port === null) entry.port = port;
    if (typeof subpath === 'string' || subpath === null) entry.subpath = subpath;
    if (Object.keys(entry).length > 0) overrides[key] = entry;
  }
  return overrides;
}

@Injectable({ providedIn: 'root' })
export class ConnectionSettingsStorage {
  private readonly storage = inject(CONNECTION_SETTINGS_STORAGE);

  read(): ConnectionSettings {
    try {
      const saved = JSON.parse(this.storage?.getItem(STORAGE_KEY) ?? 'null');
      return {
        host: typeof saved?.host === 'string' && saved.host.trim() !== '' ? saved.host : null,
        overrides: readOverrides(saved?.overrides),
      };
    } catch {
      return DEFAULT_CONNECTION_SETTINGS;
    }
  }

  write(settings: ConnectionSettings): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
      return;
    }
  }
}
