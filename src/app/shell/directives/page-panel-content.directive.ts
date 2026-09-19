import { Directive, OnDestroy, OnInit, TemplateRef, inject } from '@angular/core';
import { PageChromeStore } from '../application/page-chrome.store';

/**
 * Marks a `<ng-template>` in a routed page as that page's right-sidebar
 * content. Registers itself on init and clears itself on destroy, so
 * navigating to a page without this directive leaves the right sidebar
 * empty -- that's how "this page has no settings" is expressed.
 *
 * Usage: <ng-template appPagePanelContent>...</ng-template>
 */
@Directive({ selector: '[appPagePanelContent]' })
export class PagePanelContentDirective implements OnInit, OnDestroy {
  private readonly template = inject(TemplateRef<unknown>);
  private readonly chrome = inject(PageChromeStore);

  ngOnInit(): void {
    this.chrome.setRightPanel(this.template);
  }

  ngOnDestroy(): void {
    if (this.chrome.rightPanel() === this.template) {
      this.chrome.setRightPanel(null);
    }
  }
}
