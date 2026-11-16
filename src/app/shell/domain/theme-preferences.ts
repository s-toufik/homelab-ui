import CATALOG from './theme-catalog.json';

export const THEME_IDS = [
  'navy',
  'light',
  'contrast',
  'blossom',
  'lilac',
  'forest',
  'dragon',
  'wizarding',
] as const;
export type ThemeId = (typeof THEME_IDS)[number];
export type ThemeChoice = ThemeId | 'auto';

export interface ThemeOption {
  readonly id: ThemeId;
  readonly name: string;
  readonly tagline: string;
  readonly dark: boolean;
  readonly surface: string;
}

export const THEMES: readonly ThemeOption[] = CATALOG as ThemeOption[];

export const DAY_THEME: ThemeId = 'light';
export const NIGHT_THEME: ThemeId = 'navy';

export interface ThemePreferences {
  readonly theme: ThemeChoice;
}

export const DEFAULT_THEME_PREFERENCES: ThemePreferences = { theme: 'auto' };

export function isThemeChoice(value: unknown): value is ThemeChoice {
  return value === 'auto' || THEME_IDS.includes(value as ThemeId);
}

export function resolveTheme(choice: ThemeChoice, prefersDark: boolean): ThemeId {
  if (choice !== 'auto') return choice;
  return prefersDark ? NIGHT_THEME : DAY_THEME;
}

export function themeOption(id: ThemeId): ThemeOption {
  return THEMES.find((theme) => theme.id === id) ?? THEMES[0];
}
