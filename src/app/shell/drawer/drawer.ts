import { Component, computed, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { AccessStore } from '../application/access.store';
import { ASSISTANT_PANEL, type RecentItem } from '../application/assistant-panel';
import { CommandPaletteStore } from '../application/commands';
import { LAYOUT_STORAGE, LayoutStore } from '../application/layout.store';
import { NavigationStore } from '../application/navigation.store';
import { SHELL_ICONS } from '../domain/navigation';
import { DeleteButton } from '@shared/ui/delete-button/delete-button';
import { FeatureIcon } from '../feature-icon/feature-icon';

export const DRAWER_PAGES_KEY = 'homelab-ui.drawer.pages-open';
const DAY = 86_400_000;

export interface ConversationGroup {
  readonly title: string;
  readonly items: readonly RecentItem[];
}

export function groupByDay(items: readonly RecentItem[], now = Date.now()): ConversationGroup[] {
  const groups: { title: string; test: (age: number) => boolean }[] = [
    { title: 'Today', test: (age) => age < DAY },
    { title: 'This week', test: (age) => age >= DAY && age < 7 * DAY },
    { title: 'Earlier', test: (age) => age >= 7 * DAY },
  ];
  return groups
    .map((group) => ({
      title: group.title,
      items: items.filter((item) => group.test(now - item.updatedAt)),
    }))
    .filter((group) => group.items.length);
}

@Component({
  selector: 'app-drawer',
  imports: [RouterLink, RouterLinkActive, FeatureIcon, DeleteButton],
  templateUrl: './drawer.html',
  styleUrl: './drawer.scss',
})
export class Drawer {
  protected readonly ui = inject(LayoutStore);
  protected readonly nav = inject(NavigationStore);
  protected readonly access = inject(AccessStore);
  protected readonly session = inject(GatewaySession);
  private readonly palette = inject(CommandPaletteStore);
  private readonly router = inject(Router);
  private readonly storage = inject(LAYOUT_STORAGE);
  private readonly assistant = inject(ASSISTANT_PANEL, { optional: true });
  protected readonly icons = SHELL_ICONS;
  protected readonly conversations = computed(() => groupByDay(this.assistant?.recent() ?? []));
  protected readonly waiting = computed(() => this.assistant?.waiting() ?? 0);
  protected readonly name = computed(() => this.session.user()?.username ?? 'You');
  protected readonly pagesOpen = signal(this.read(DRAWER_PAGES_KEY) === 'true');
  protected readonly conversationCount = computed(() => this.assistant?.recent().length ?? 0);
  protected readonly pageCount = computed(() =>
    this.nav.sections().reduce((sum, entry) => sum + entry.pages.length, 0),
  );

  protected search(): void {
    this.ui.drawerOpen.set(false);
    this.palette.open();
  }

  protected close(): void {
    this.ui.drawerOpen.set(false);
  }

  protected removeAll(): void {
    this.assistant?.removeAll();
    if (this.router.url.startsWith('/assistant/')) void this.router.navigate(['/assistant']);
  }

  protected togglePages(): void {
    this.pagesOpen.update((open) => !open);
    try {
      this.storage?.setItem(DRAWER_PAGES_KEY, String(this.pagesOpen()));
    } catch {
      return;
    }
  }

  protected remove(item: RecentItem): void {
    this.assistant?.remove(item.id);
    if (this.router.url.split(/[?#]/)[0] === `/assistant/${item.id}`) {
      void this.router.navigate(['/assistant']);
    }
  }

  private read(key: string): string | null {
    try {
      return this.storage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  }
}
