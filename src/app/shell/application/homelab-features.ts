import { InjectionToken, Provider } from '@angular/core';
import type { HomelabFeature } from '../domain/homelab-feature';

export const HOMELAB_FEATURES = new InjectionToken<readonly HomelabFeature[]>('HOMELAB_FEATURES');

export function provideHomelabFeature(describe: () => HomelabFeature): Provider {
  return { provide: HOMELAB_FEATURES, multi: true, useFactory: describe };
}
