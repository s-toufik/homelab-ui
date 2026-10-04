import { Component, computed, effect, inject } from '@angular/core';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { FeatureStatusStore } from '../application/feature-status.store';
import { HOMELAB_FEATURES } from '../application/homelab-features';
import { LayoutStore } from '../application/layout.store';
import { ResourceStatusStore } from '../application/resource-status.store';
import { FEATURE_CATEGORIES } from '../domain/homelab-feature';

@Component({
  selector: 'app-nav-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-sidebar.html',
  styleUrl: './nav-sidebar.scss',
})
export class NavSidebar {
  protected readonly ui = inject(LayoutStore);
  private readonly status = inject(FeatureStatusStore);
  protected readonly resourceStatus = inject(ResourceStatusStore);
  protected readonly resourceLabel = {
    checking: 'Checking',
    up: 'Up',
    down: 'Down',
    unknown: 'No data',
  } as const;

  // The same apps and pages as the overview, in the same order.
  protected readonly features = [...(inject(HOMELAB_FEATURES, { optional: true }) ?? [])].sort(
    (a, b) => FEATURE_CATEGORIES.indexOf(a.category) - FEATURE_CATEGORIES.indexOf(b.category),
  );
  protected readonly host = inject(HomelabServer).host;

  protected readonly health = computed(() => {
    const summary = this.status.summary();
    if (!summary) return { level: 'checking', label: 'Checking services…' };
    const { online, total } = summary;
    const level = online === total ? 'online' : online === 0 ? 'offline' : 'partial';
    return { level, label: `${online} of ${total} services reachable` };
  });

  constructor() {
    effect(() => {
      if (this.ui.navOpen()) {
        void this.status.refresh();
        void this.resourceStatus.refresh();
      }
    });
  }
}
