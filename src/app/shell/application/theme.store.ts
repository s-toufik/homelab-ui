import { Injectable, effect, inject, signal } from '@angular/core';
import type { ThemePaletteId } from '../domain/theme-preferences';
import { ThemePreferencesStorage } from '../infrastructure/theme-preferences.storage';

@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly storage = inject(ThemePreferencesStorage);
  private readonly saved = this.storage.read();

  readonly palette = signal<ThemePaletteId>(this.saved.palette);

  constructor() {
    effect(() => {
      document.documentElement.setAttribute('data-palette', this.palette());
    });

    effect(() => {
      this.storage.write({ palette: this.palette() });
    });
  }
}
