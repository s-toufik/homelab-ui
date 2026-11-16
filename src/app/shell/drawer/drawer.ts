import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { AccessStore } from '../application/access.store';
import { ASSISTANT_PANEL } from '../application/assistant-panel';
import { CommandPaletteStore } from '../application/commands';
import { LayoutStore } from '../application/layout.store';
import { NavigationStore } from '../application/navigation.store';
import { SHELL_ICONS } from '../domain/navigation';
import { FeatureIcon } from '../feature-icon/feature-icon';

@Component({
  selector: 'app-drawer',
  imports: [RouterLink, RouterLinkActive, FeatureIcon],
  templateUrl: './drawer.html',
  styleUrl: './drawer.scss',
})
export class Drawer {
  protected readonly ui = inject(LayoutStore);
  protected readonly nav = inject(NavigationStore);
  protected readonly access = inject(AccessStore);
  protected readonly session = inject(GatewaySession);
  private readonly palette = inject(CommandPaletteStore);
  private readonly assistant = inject(ASSISTANT_PANEL, { optional: true });
  protected readonly icons = SHELL_ICONS;
  protected readonly recent = computed(() => this.assistant?.recent().slice(0, 12) ?? []);
  protected readonly waiting = computed(() => this.assistant?.waiting() ?? 0);
  protected readonly name = computed(() => this.session.user()?.username ?? 'You');

  protected search(): void {
    this.ui.drawerOpen.set(false);
    this.palette.open();
  }

  protected close(): void {
    this.ui.drawerOpen.set(false);
  }
}
