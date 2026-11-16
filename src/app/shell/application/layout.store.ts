import { Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import { PaneState } from '@shared/ui/side-pane/pane-state';

export const ASSISTANT_WIDTH_KEY = 'homelab-ui.assistant-width';
export const ASSISTANT_DEFAULT_WIDTH = 416;
const ASSISTANT_MIN_WIDTH = 320;

export const LAYOUT_STORAGE = new InjectionToken<Storage | null>('LAYOUT_STORAGE', {
  factory: () => {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  },
});

export const SIDEBAR_KEY = 'homelab-ui.sidebar';
export const PAGE_PANEL_KEY = 'homelab-ui.page-panel';

function readWidth(storage: Storage | null): number {
  try {
    const saved = Number(storage?.getItem(ASSISTANT_WIDTH_KEY));
    return Number.isFinite(saved) && saved > 0 ? saved : ASSISTANT_DEFAULT_WIDTH;
  } catch {
    return ASSISTANT_DEFAULT_WIDTH;
  }
}

export function clampAssistantWidth(width: number, viewport: number): number {
  const max = Math.max(ASSISTANT_MIN_WIDTH, Math.round(viewport * 0.8));
  return Math.round(Math.min(Math.max(width, ASSISTANT_MIN_WIDTH), max));
}

@Injectable({ providedIn: 'root' })
export class LayoutStore {
  private readonly storage = inject(LAYOUT_STORAGE);

  readonly sidebar = new PaneState({
    key: SIDEBAR_KEY,
    width: 240,
    min: 200,
    max: 360,
    pinned: true,
    storage: this.storage,
  });
  readonly sidebarCollapsed = computed(() => !this.sidebar.pinned());

  readonly panel = new PaneState({
    key: PAGE_PANEL_KEY,
    width: 300,
    min: 240,
    max: 520,
    pinned: false,
    storage: this.storage,
  });
  readonly panelPinned = this.panel.pinned;
  readonly panelOpen = this.panel.open;

  readonly drawerOpen = signal(false);

  private readonly assistantOpenState = signal(false);
  readonly assistantOpen = this.assistantOpenState.asReadonly();
  private readonly assistantWidthState = signal(readWidth(this.storage));
  readonly assistantWidth = computed(() =>
    clampAssistantWidth(this.assistantWidthState(), globalThis.innerWidth ?? 1440),
  );
  readonly resizing = signal(false);

  toggleSidebar(): void {
    this.sidebar.togglePin();
  }

  togglePanel(): void {
    this.panel.togglePin();
    if (this.panel.pinned()) this.assistantOpenState.set(false);
  }

  closePanel(): void {
    this.panel.setPinned(false);
  }

  hoverPanel(hovering: boolean): void {
    this.panel.hover(hovering);
  }

  toggleAssistant(): void {
    this.assistantOpenState.update((open) => !open);
    if (this.assistantOpenState()) this.closePanel();
  }

  closeAssistant(): void {
    this.assistantOpenState.set(false);
  }

  resizeAssistant(width: number): void {
    this.assistantWidthState.set(clampAssistantWidth(width, globalThis.innerWidth ?? 1440));
  }

  saveAssistantWidth(): void {
    try {
      this.storage?.setItem(ASSISTANT_WIDTH_KEY, String(this.assistantWidthState()));
    } catch {
      return;
    }
  }
}
