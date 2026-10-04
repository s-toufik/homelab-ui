import { Injectable, computed, inject, signal } from '@angular/core';
import type { HomelabFeature } from '../domain/homelab-feature';
import { HOMELAB_FEATURES } from './homelab-features';

export type FeatureStatus = 'checking' | 'online' | 'offline';

@Injectable({ providedIn: 'root' })
export class FeatureStatusStore {
  private readonly checked: readonly HomelabFeature[] = (
    inject(HOMELAB_FEATURES, { optional: true }) ?? []
  ).filter((feature) => feature.checkHealth);

  readonly statuses = signal<Readonly<Record<string, FeatureStatus>>>({});

  readonly summary = computed(() => {
    const statuses = this.checked.map((feature) => this.statuses()[feature.id]);
    if (statuses.some((status) => status === undefined || status === 'checking')) return null;
    const online = statuses.filter((status) => status === 'online').length;
    return { online, total: statuses.length };
  });

  async refresh(): Promise<void> {
    await Promise.all(this.checked.map((feature) => this.check(feature)));
  }

  private async check(feature: HomelabFeature): Promise<void> {
    this.set(feature.id, 'checking');
    const online = await feature.checkHealth!().catch(() => false);
    this.set(feature.id, online ? 'online' : 'offline');
  }

  private set(id: string, status: FeatureStatus): void {
    this.statuses.update((current) => ({ ...current, [id]: status }));
  }
}
