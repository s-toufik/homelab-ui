import { Injectable, inject } from '@angular/core';
import { DEFAULT_CAST_CHOICE, isCastChoice, type CastChoice } from '../domain/agent-cast';
import { THEME_PREFERENCES_STORAGE } from './theme-preferences.storage';

export const CAST_STORAGE_KEY = 'homelab-ui.agent-cast';

@Injectable({ providedIn: 'root' })
export class CastPreferencesStorage {
  private readonly storage = inject(THEME_PREFERENCES_STORAGE);

  read(): CastChoice {
    try {
      const saved = this.storage?.getItem(CAST_STORAGE_KEY);
      return isCastChoice(saved) ? saved : DEFAULT_CAST_CHOICE;
    } catch {
      return DEFAULT_CAST_CHOICE;
    }
  }

  write(choice: CastChoice): void {
    try {
      this.storage?.setItem(CAST_STORAGE_KEY, choice);
    } catch {
      return;
    }
  }
}
