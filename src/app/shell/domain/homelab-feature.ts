export const FEATURE_CATEGORIES = [
  'Platform',
  'AI',
  'Automation',
  'Observability',
  'Streaming',
] as const;

export type FeatureCategory = (typeof FEATURE_CATEGORIES)[number];

export type FeatureEntry = { kind: 'page'; path: string };

export type FeatureIcon = readonly string[];

export const HUES = [
  'orange',
  'teal',
  'indigo',
  'purple',
  'blue',
  'green',
  'rose',
  'amber',
  'slate',
] as const;

export type Hue = (typeof HUES)[number];

export interface HomelabFeature {
  id: string;
  label: string;
  description: string;
  icon: FeatureIcon;
  color: string;
  hue: Hue;
  category: FeatureCategory;
  entry: FeatureEntry;
  access?: string;
  adminOnly?: boolean;
  listed?: boolean;
  checkHealth?: () => Promise<boolean>;
}
