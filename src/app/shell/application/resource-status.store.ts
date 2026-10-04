import { Injectable, inject, signal } from '@angular/core';
import type { HomelabResource, ResourceHealth } from '../domain/homelab-resource';
import { HOMELAB_RESOURCES } from './homelab-resources';

export type ResourceStatus = ResourceHealth | 'checking';

@Injectable({ providedIn: 'root' })
export class ResourceStatusStore {
  readonly resources: readonly HomelabResource[] =
    inject(HOMELAB_RESOURCES, { optional: true }) ?? [];

  readonly statuses = signal<Readonly<Partial<Record<string, ResourceStatus>>>>({});

  async refresh(): Promise<void> {
    await Promise.all(this.resources.map((resource) => this.check(resource)));
  }

  private async check(resource: HomelabResource): Promise<void> {
    this.set(resource.id, 'checking');
    const health = await resource.checkHealth().catch((): ResourceHealth => 'unknown');
    this.set(resource.id, health);
  }

  private set(id: string, status: ResourceStatus): void {
    this.statuses.update((current) => ({ ...current, [id]: status }));
  }
}
