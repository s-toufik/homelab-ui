export const CREATIVE_THEME_IDS = [
  'classic',
  'terminal',
  'paper',
  'nightshift',
  'aurora',
  'arcade',
  'nord',
  'neon',
  'sandstone',
] as const;
export type ThemePaletteId = (typeof CREATIVE_THEME_IDS)[number];

export interface ThemePalette {
  readonly id: ThemePaletteId;
  readonly label: string;
  readonly swatch: string;
}

export const CREATIVE_THEMES: readonly ThemePalette[] = [
  { id: 'classic', label: 'Classic', swatch: '#3b82f6' },
  { id: 'terminal', label: 'Terminal', swatch: '#00ff6a' },
  { id: 'paper', label: 'Paper', swatch: '#c2572c' },
  { id: 'nightshift', label: 'Nightshift', swatch: '#ffffff' },
  { id: 'aurora', label: 'Aurora', swatch: '#7c6cf6' },
  { id: 'arcade', label: 'Arcade', swatch: '#ff2e92' },
  { id: 'nord', label: 'Nord Frost', swatch: '#88c0d0' },
  { id: 'neon', label: 'Neon Grid', swatch: '#ff2ee6' },
  { id: 'sandstone', label: 'Sandstone', swatch: '#1a8c82' },
];

export interface ThemePreferences {
  readonly palette: ThemePaletteId;
}

export const DEFAULT_THEME_PREFERENCES: ThemePreferences = { palette: 'classic' };
