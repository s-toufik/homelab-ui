import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { AccessStore } from '../application/access.store';
import { ASSISTANT_PANEL } from '../application/assistant-panel';
import { AppsStore } from '../application/apps.store';
import { NavigationStore } from '../application/navigation.store';
import { SHELL_ICONS } from '../domain/navigation';
import { FeatureIcon } from '../feature-icon/feature-icon';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, FeatureIcon],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.scss',
})
export class Sidebar {
  protected readonly nav = inject(NavigationStore);
  protected readonly access = inject(AccessStore);
  protected readonly session = inject(GatewaySession);
  private readonly assistant = inject(ASSISTANT_PANEL, { optional: true });
  protected readonly icons = SHELL_ICONS;
  protected readonly waiting = computed(() => this.assistant?.waiting() ?? 0);
  protected readonly menuOpen = signal(false);
  protected readonly name = computed(() => this.session.user()?.username ?? 'You');

  constructor() {
    void inject(AppsStore).load();
  }
}
