import { Injectable, computed, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutStore {
  private readonly navPinnedState = signal(false);
  private readonly navHoveringState = signal(false);
  readonly navPinned = this.navPinnedState.asReadonly();
  readonly navOpen = computed(() => this.navPinnedState() || this.navHoveringState());

  private readonly panelPinnedState = signal(false);
  private readonly panelHoveringState = signal(false);
  readonly panelPinned = this.panelPinnedState.asReadonly();
  readonly panelOpen = computed(() => this.panelPinnedState() || this.panelHoveringState());

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
}
