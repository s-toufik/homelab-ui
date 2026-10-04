import { Directive, OnDestroy, OnInit, TemplateRef, inject } from '@angular/core';
import { PageChromeStore } from '../application/page-chrome.store';

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
