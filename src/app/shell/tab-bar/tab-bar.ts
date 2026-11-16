import { Component, computed, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ASSISTANT_PANEL } from '../application/assistant-panel';
import { SHELL_ICONS } from '../domain/navigation';
import { FeatureIcon } from '../feature-icon/feature-icon';

@Component({
  selector: 'app-tab-bar',
  imports: [RouterLink, RouterLinkActive, FeatureIcon],
  template: `
    <nav class="tabs" aria-label="Main">
      <a routerLink="/" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }">
        <app-feature-icon [paths]="icons.today" [size]="22" />Today
      </a>
      <a routerLink="/assistant" routerLinkActive="on">
        <span class="tabs__icon">
          <app-feature-icon [paths]="icons.assistant" [size]="22" />
          @if (waiting()) {
            <span class="tabs__badge">{{ waiting() }}</span>
          }
        </span>
        Assistant
      </a>
      <a routerLink="/more" routerLinkActive="on">
        <app-feature-icon [paths]="icons.browse" [size]="22" />More
      </a>
    </nav>
  `,
  styles: `
    :host {
      display: block;
      flex-shrink: 0;
    }
    .tabs {
      display: flex;
      padding: 0.4rem 0.5rem calc(0.4rem + var(--safe-bottom));
      border-top: var(--border-width) solid var(--border);
      background: var(--surface-side);
    }
    a {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.2rem;
      min-height: 2.9rem;
      justify-content: center;
      color: var(--text-muted);
      font-size: 0.68rem;
      font-weight: 500;
      text-decoration: none;
    }
    a.on {
      color: var(--accent);
    }
    .tabs__icon {
      position: relative;
      display: flex;
    }
    .tabs__badge {
      position: absolute;
      top: -0.3rem;
      right: -0.6rem;
      min-width: 1rem;
      height: 1rem;
      padding: 0 0.25rem;
      border-radius: 0.5rem;
      background: var(--accent);
      color: var(--on-accent);
      font-size: 0.62rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    @media (min-width: 768px) {
      :host {
        display: none;
      }
    }
  `,
})
export class TabBar {
  private readonly assistant = inject(ASSISTANT_PANEL, { optional: true });
  protected readonly icons = SHELL_ICONS;
  protected readonly waiting = computed(() => this.assistant?.waiting() ?? 0);
}
