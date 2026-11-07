import { Injectable, InjectionToken, computed, inject, signal } from '@angular/core';

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
  private readonly navPinnedState = signal(false);
  private readonly navHoveringState = signal(false);
  readonly navPinned = this.navPinnedState.asReadonly();
  readonly navOpen = computed(() => this.navPinnedState() || this.navHoveringState());

  private readonly panelPinnedState = signal(false);
  private readonly panelHoveringState = signal(false);
  readonly panelPinned = this.panelPinnedState.asReadonly();
  readonly panelOpen = computed(() => this.panelPinnedState() || this.panelHoveringState());

  private readonly assistantOpenState = signal(false);
  readonly assistantOpen = this.assistantOpenState.asReadonly();
  private readonly assistantWidthState = signal(readWidth(this.storage));
  readonly assistantWidth = computed(() =>
    clampAssistantWidth(this.assistantWidthState(), globalThis.innerWidth ?? 1440),
  );
  readonly resizing = signal(false);

  toggleNav(): void {
    this.navPinnedState.update((pinned) => !pinned);
  }

  closeNav(): void {
    this.navPinnedState.set(false);
    this.navHoveringState.set(false);
  }

  hoverNav(hovering: boolean): void {
    this.navHoveringState.set(hovering);
  }

  collapseNavPeek(): void {
    this.navHoveringState.set(false);
  }

  togglePanel(): void {
    this.panelPinnedState.update((pinned) => !pinned);
    if (this.panelPinnedState()) this.assistantOpenState.set(false);
  }

  closePanel(): void {
    this.panelPinnedState.set(false);
    this.panelHoveringState.set(false);
  }

  hoverPanel(hovering: boolean): void {
    this.panelHoveringState.set(hovering);
  }

  collapsePanelPeek(): void {
    this.panelHoveringState.set(false);
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
