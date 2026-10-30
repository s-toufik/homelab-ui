import { Injectable, InjectionToken, inject } from '@angular/core';
import {
  CREATIVE_THEMES,
  DEFAULT_THEME_PREFERENCES,
  type ThemePaletteId,
  type ThemePreferences,
} from '../domain/theme-preferences';

export const THEME_STORAGE_KEY = 'homelab-ui.theme-preferences';

export const THEME_PREFERENCES_STORAGE = new InjectionToken<Storage | null>(
  'THEME_PREFERENCES_STORAGE',
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

function isThemePaletteId(value: unknown): value is ThemePaletteId {
  return CREATIVE_THEMES.some((palette) => palette.id === value);
}

@Injectable({ providedIn: 'root' })
export class ThemePreferencesStorage {
  private readonly storage = inject(THEME_PREFERENCES_STORAGE);

  read(): ThemePreferences {
    try {
      const saved = JSON.parse(this.storage?.getItem(THEME_STORAGE_KEY) ?? 'null');
      return {
        palette: isThemePaletteId(saved?.palette)
          ? saved.palette
          : DEFAULT_THEME_PREFERENCES.palette,
      };
    } catch {
      return DEFAULT_THEME_PREFERENCES;
    }
  }

  write(preferences: ThemePreferences): void {
    try {
      this.storage?.setItem(THEME_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      return;
    }
  }
}
