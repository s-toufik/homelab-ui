import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { AccessStore } from '../application/access.store';
import { NavigationStore } from '../application/navigation.store';
import { SHELL_ICONS } from '../domain/navigation';
import { FeatureIcon } from '../feature-icon/feature-icon';

@Component({
  selector: 'app-more-page',
  imports: [RouterLink, FeatureIcon, PageHeader],
  template: `
    <div class="hl-page">
      <app-page-header eyebrow="Homelab" title="More" />
      @if (access.isAdmin()) {
        <div class="hl-list">
          <a class="hl-list__row" routerLink="/map">
            <app-feature-icon [paths]="icons.map" [size]="17" /><span class="grow">Map</span>
          </a>
          <a class="hl-list__row" routerLink="/people">
            <app-feature-icon [paths]="icons.people" [size]="17" /><span class="grow">People</span>
          </a>
        </div>
      }
      @for (entry of nav.sections(); track entry.section) {
        <section>
          <h2 class="hl-cap">{{ entry.section }}</h2>
          <div class="hl-list">
            @for (page of entry.pages; track page.id) {
              <a class="hl-list__row" [routerLink]="page.path">
                <app-feature-icon [paths]="page.icon" [size]="17" />
                <span class="grow"
                  >{{ page.label }}<small>{{ page.tagline }}</small></span
                >
              </a>
            }
          </div>
        </section>
      }
      <section>
        <h2 class="hl-cap">You</h2>
        <div class="hl-list">
          <a class="hl-list__row" routerLink="/account">
            <app-feature-icon [paths]="icons.you" [size]="17" /><span class="grow">Account</span>
          </a>
          <a class="hl-list__row" routerLink="/appearance">
            <app-feature-icon [paths]="icons.settings" [size]="17" /><span class="grow"
              >Appearance</span
            >
          </a>
          @if (session.enabled) {
            <a class="hl-list__row" [href]="session.signOutUrl"
              ><span class="grow">Sign out</span></a
            >
          }
        </div>
      </section>
    </div>
  `,
  styles: `
    :host {
      display: flex;
      flex: 1 1 auto;
      min-height: 0;
    }
    .grow {
      flex: 1;
      display: flex;
      flex-direction: column;
      min-width: 0;
    }
    small {
      color: var(--text-muted);
      font-size: 0.78rem;
    }
  `,
})
export class MorePage {
  protected readonly access = inject(AccessStore);
  protected readonly nav = inject(NavigationStore);
  protected readonly session = inject(GatewaySession);
  protected readonly icons = SHELL_ICONS;
}
