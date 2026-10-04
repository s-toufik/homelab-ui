import { InjectionToken, Provider } from '@angular/core';
import type { HomelabResource } from '../domain/homelab-resource';

export const HOMELAB_RESOURCES = new InjectionToken<readonly HomelabResource[]>(
  'HOMELAB_RESOURCES',
);

export function provideHomelabResource(describe: () => HomelabResource): Provider {
  return { provide: HOMELAB_RESOURCES, multi: true, useFactory: describe };
}
