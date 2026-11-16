import { InjectionToken, Provider, Signal } from '@angular/core';
import type { HomelabApp } from '../domain/homelab-app';

export interface AppSource {
  readonly apps: Signal<readonly HomelabApp[]>;
  load(): Promise<void>;
}

export const APP_SOURCES = new InjectionToken<readonly AppSource[]>('APP_SOURCES');

export function provideAppSource(describe: () => AppSource): Provider {
  return { provide: APP_SOURCES, multi: true, useFactory: describe };
}
