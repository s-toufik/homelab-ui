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

export interface HomelabFeature {
  id: string;
  label: string;
  description: string;
  icon: FeatureIcon;
  color: string;
  category: FeatureCategory;
  entry: FeatureEntry;
  adminOnly?: boolean;
  checkHealth?: () => Promise<boolean>;
}
