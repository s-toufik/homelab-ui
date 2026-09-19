import { Injectable, signal } from '@angular/core';

/** Open/closed state of the two off-canvas sidebars. Both are retractable
 * at every screen size and start closed. */
@Injectable({ providedIn: 'root' })
export class LayoutStore {
  readonly navOpen = signal(false);
  readonly panelOpen = signal(false);

  toggleNav(): void {
    this.navOpen.update((open) => !open);
  }

  closeNav(): void {
    this.navOpen.set(false);
  }

  togglePanel(): void {
    this.panelOpen.update((open) => !open);
  }

  closePanel(): void {
    this.panelOpen.set(false);
  }
}
