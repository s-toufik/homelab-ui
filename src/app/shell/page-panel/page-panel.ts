import { NgTemplateOutlet } from '@angular/common';
import { Component, inject } from '@angular/core';
import { LayoutStore } from '../application/layout.store';
import { PageChromeStore } from '../application/page-chrome.store';

@Component({
  selector: 'app-page-panel',
  imports: [NgTemplateOutlet],
  templateUrl: './page-panel.html',
  styleUrl: './page-panel.scss',
})
export class PagePanel {
  protected readonly ui = inject(LayoutStore);
  protected readonly chrome = inject(PageChromeStore);
}
