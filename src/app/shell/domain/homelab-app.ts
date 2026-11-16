import type { FeatureCategory, FeatureIcon, Hue } from './homelab-feature';

export type AppKind = 'agent' | 'app' | 'page';

export interface HomelabApp {
  readonly id: string;
  readonly label: string;
  readonly tagline: string;
  readonly hue: Hue;
  readonly icon: FeatureIcon;
  readonly path: string;
  readonly kind: AppKind;
  readonly category: FeatureCategory | null;
  readonly access?: string;
  readonly adminOnly?: boolean;
}
