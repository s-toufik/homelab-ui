import { Injectable, InjectionToken, inject } from '@angular/core';
import { DEFAULT_PREFERENCES, type AgentPreferences } from '../../domain/agent-preferences';

const STORAGE_KEY = 'homelab-ui.agent.preferences';

export const PREFERENCES_STORAGE = new InjectionToken<Storage | null>('PREFERENCES_STORAGE', {
  factory: () => {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  },
});

@Injectable({ providedIn: 'root' })
export class AgentPreferencesStorage {
  private readonly storage = inject(PREFERENCES_STORAGE);

  read(): AgentPreferences {
    try {
      const saved = JSON.parse(this.storage?.getItem(STORAGE_KEY) ?? 'null');
      return {
        modelName:
          typeof saved?.modelName === 'string' ? saved.modelName : DEFAULT_PREFERENCES.modelName,
        autoApprove: saved?.autoApprove === true,
      };
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  write(preferences: AgentPreferences): void {
    try {
      this.storage?.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      return;
    }
  }
}
