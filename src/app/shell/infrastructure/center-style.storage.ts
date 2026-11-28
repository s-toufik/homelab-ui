import { Injectable, inject } from '@angular/core';
import { DEFAULT_CENTER_STYLE, isCenterStyle, type CenterStyleId } from '../domain/center-style';
import { THEME_PREFERENCES_STORAGE } from './theme-preferences.storage';

export const CENTER_STYLE_STORAGE_KEY = 'homelab-ui.center-style';

@Injectable({ providedIn: 'root' })
export class CenterStyleStorage {
  private readonly storage = inject(THEME_PREFERENCES_STORAGE);

  read(): CenterStyleId {
    try {
      const saved = this.storage?.getItem(CENTER_STYLE_STORAGE_KEY);
      return isCenterStyle(saved) ? saved : DEFAULT_CENTER_STYLE;
    } catch {
      return DEFAULT_CENTER_STYLE;
    }
  }

  write(style: CenterStyleId): void {
    try {
      this.storage?.setItem(CENTER_STYLE_STORAGE_KEY, style);
    } catch {
      return;
    }
  }
}
