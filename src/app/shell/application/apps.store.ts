import { Injectable, computed, inject } from '@angular/core';
import type { HomelabApp } from '../domain/homelab-app';
import type { HomelabFeature } from '../domain/homelab-feature';
import { AccessStore } from './access.store';
import { APP_SOURCES } from './app-sources';

const PERSONAL = new Set(['account']);

export function featureApp(feature: HomelabFeature): HomelabApp {
  return {
    id: feature.id,
    label: feature.label,
    tagline: feature.description,
    hue: feature.hue,
    icon: feature.icon,
    path: feature.entry.path,
    kind: feature.access?.startsWith('app:') ? 'app' : 'page',
    category: feature.category,
    access: feature.access,
    adminOnly: feature.adminOnly,
  };
}

@Injectable({ providedIn: 'root' })
export class AppsStore {
  private readonly access = inject(AccessStore);
  private readonly sources = inject(APP_SOURCES, { optional: true }) ?? [];
  private loading: Promise<void> | null = null;

  readonly agents = computed(() =>
    this.sources
      .flatMap((source) => source.apps())
      .filter((app) => app.kind === 'agent' && this.access.canUse(app)),
  );

  readonly pages = computed(() =>
    this.access
      .features()
      .filter((feature) => !PERSONAL.has(feature.id))
      .map(featureApp),
  );

  readonly all = computed<readonly HomelabApp[]>(() => [...this.agents(), ...this.pages()]);

  load(): Promise<void> {
    this.loading ??= Promise.all(this.sources.map((source) => source.load())).then(
      () => undefined,
      () => {
        this.loading = null;
      },
    );
    return this.loading;
  }
}
