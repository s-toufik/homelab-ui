import { Injectable, TemplateRef, signal } from '@angular/core';

/**
 * Lets the currently routed page contribute content to the shell's right
 * sidebar without the shell knowing anything about that page. A page that
 * has settings registers a template (see PagePanelContentDirective); a page
 * that doesn't -- like the home dashboard -- simply never registers one,
 * and the shell hides the right sidebar entirely.
 */
@Injectable({ providedIn: 'root' })
export class PageChromeStore {
  readonly rightPanel = signal<TemplateRef<unknown> | null>(null);

  setRightPanel(template: TemplateRef<unknown> | null): void {
    this.rightPanel.set(template);
  }
}
