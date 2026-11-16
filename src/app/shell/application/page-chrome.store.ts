import { Injectable, TemplateRef, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class PageChromeStore {
  readonly rightPanel = signal<TemplateRef<unknown> | null>(null);
  readonly title = signal<string | null>(null);
  readonly titleMenu = signal<(() => void) | null>(null);

  setRightPanel(template: TemplateRef<unknown> | null): void {
    this.rightPanel.set(template);
  }
}
