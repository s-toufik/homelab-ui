import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { LayoutStore } from '../application/layout.store';
import { PageChromeStore } from '../application/page-chrome.store';
import { NavSidebar } from '../nav-sidebar/nav-sidebar';
import { PagePanel } from '../page-panel/page-panel';

@Component({
  selector: 'app-layout',
  imports: [RouterOutlet, NavSidebar, PagePanel],
  templateUrl: './layout.html',
  styleUrl: './layout.scss',
})
export class Layout {
  protected readonly ui = inject(LayoutStore);
  protected readonly chrome = inject(PageChromeStore);
}
