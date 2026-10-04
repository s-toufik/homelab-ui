export const FEATURE_CATEGORIES = ['AI', 'Observability', 'Streaming'] as const;

export type FeatureCategory = (typeof FEATURE_CATEGORIES)[number];

export type FeatureEntry = { kind: 'page'; path: string } | { kind: 'link'; url: string };

export type FeatureIcon = readonly string[];

export interface HomelabFeature {
  id: string;
  label: string;
  description: string;
  icon: FeatureIcon;
  color: string;
  category: FeatureCategory;
  entry: FeatureEntry;
  checkHealth?: () => Promise<boolean>;
}
