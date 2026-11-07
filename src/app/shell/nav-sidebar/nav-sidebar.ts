import { Component, computed, effect, inject } from '@angular/core';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { HOMELAB_FEATURES } from '../application/homelab-features';
import { LayoutStore } from '../application/layout.store';
import { ResourceStatusStore } from '../application/resource-status.store';
import { SettingsModalStore } from '../application/settings-modal.store';
import { FEATURE_CATEGORIES } from '../domain/homelab-feature';

@Component({
  selector: 'app-nav-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-sidebar.html',
  styleUrl: './nav-sidebar.scss',
})
export class NavSidebar {
  protected readonly ui = inject(LayoutStore);
  protected readonly settings = inject(SettingsModalStore);
  protected readonly resourceStatus = inject(ResourceStatusStore);
  protected readonly resourceLabel = {
    checking: 'Checking',
    up: 'Up',
    down: 'Down',
    unknown: 'No data',
  } as const;

  private readonly allFeatures = [...(inject(HOMELAB_FEATURES, { optional: true }) ?? [])].sort(
    (a, b) => FEATURE_CATEGORIES.indexOf(a.category) - FEATURE_CATEGORIES.indexOf(b.category),
  );
  protected readonly host = inject(HomelabServer).host;
  protected readonly session = inject(GatewaySession);
  protected readonly sections = computed(() => {
    const features = this.allFeatures.filter(
      (feature) => !feature.adminOnly || this.session.isAdmin(),
    );
    return FEATURE_CATEGORIES.map((category) => ({
      category,
      features: features.filter((feature) => feature.category === category),
    })).filter((section) => section.features.length > 0);
  });

  protected initial(username: string): string {
    return username.charAt(0).toUpperCase();
  }

  constructor() {
    effect(() => {
      if (this.ui.navOpen()) {
        void this.resourceStatus.refresh();
      }
    });
  }
}
