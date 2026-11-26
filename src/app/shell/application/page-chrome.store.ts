import { Injectable, TemplateRef, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PageChromeStore {
  readonly rightPanel = signal<TemplateRef<unknown> | null>(null);
  readonly title = signal<string | null>(null);
  readonly titleMenu = signal<(() => void) | null>(null);
  /** Height in px of a bar the page pins to the bottom of the screen, so floating buttons sit above it. */
  readonly bottomInset = signal(0);

  setRightPanel(template: TemplateRef<unknown> | null): void {
    this.rightPanel.set(template);
  }
}
