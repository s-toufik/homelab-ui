import { Component, computed, effect, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { SwarmAvatar } from '@shared/ui/swarm-avatar/swarm-avatar';
import { filter, map } from 'rxjs';
import { ASSISTANT_PANEL } from '../application/assistant-panel';
import { LayoutStore } from '../application/layout.store';
import { PageChromeStore } from '../application/page-chrome.store';
import { ThemeStore } from '../application/theme.store';
import { AssistantDrawer } from '../assistant-drawer/assistant-drawer';
import { NavSidebar } from '../nav-sidebar/nav-sidebar';
import { PagePanel } from '../page-panel/page-panel';
import { SettingsModal } from '../settings-modal/settings-modal';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, NavSidebar, PagePanel, AssistantDrawer, SettingsModal, SwarmAvatar],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  protected readonly ui = inject(LayoutStore);
  protected readonly chrome = inject(PageChromeStore);
  private readonly theme = inject(ThemeStore);
  private readonly assistant = inject(ASSISTANT_PANEL, { optional: true });
  private readonly router = inject(Router);

  private readonly path = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url.split(/[?#]/)[0]),
    ),
    { initialValue: this.router.url.split(/[?#]/)[0] },
  );

  protected readonly assistantAvailable = computed(() => {
    const panel = this.assistant;
    if (!panel) return false;
    const path = this.path();
    return !panel.hiddenOn.some((hidden) => path === hidden || path.startsWith(`${hidden}/`));
  });

  protected readonly assistantPhase = computed(() => this.assistant?.phase() ?? 'idle');
  protected readonly assistantWorking = computed(() => {
    const phase = this.assistantPhase();
    return phase !== 'idle' && phase !== 'error';
  });

  constructor() {
    effect(() => {
      if (!this.assistantAvailable()) this.ui.closeAssistant();
    });
  }
}
