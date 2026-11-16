import { InjectionToken } from '@angular/core';
import type { ThemeChoice } from '../domain/theme-preferences';

export interface ThemeAccount {
  read(): Promise<ThemeChoice | null>;
  write(choice: ThemeChoice): Promise<void>;
}

export const THEME_ACCOUNT = new InjectionToken<ThemeAccount>('THEME_ACCOUNT');
