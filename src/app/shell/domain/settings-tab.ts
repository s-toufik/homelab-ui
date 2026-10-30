export const SETTINGS_TABS = ['general', 'connectors', 'appearance', 'about'] as const;
export type SettingsTab = (typeof SETTINGS_TABS)[number];
