import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { LayoutStore } from '../application/layout.store';
import { NAV_ITEMS } from '../domain/nav-item';

@Component({
  selector: 'app-nav-sidebar',
  imports: [RouterLink, RouterLinkActive],
  templateUrl: './nav-sidebar.html',
  styleUrl: './nav-sidebar.scss',
})
export class NavSidebar {
  protected readonly ui = inject(LayoutStore);
  protected readonly navItems = NAV_ITEMS;
}
