import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { NAV_ITEMS } from '@shell/domain/nav-item';

@Component({
  selector: 'app-home-page',
  imports: [RouterLink],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  protected readonly navItems = NAV_ITEMS;
}
