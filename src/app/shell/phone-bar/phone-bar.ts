import { Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavigationEnd, Router, RouterLink } from '@angular/router';
import { filter, map } from 'rxjs';
import { CommandPaletteStore } from '../application/commands';
import { HOMELAB_FEATURES } from '../application/homelab-features';
import { LayoutStore } from '../application/layout.store';
import { PageChromeStore } from '../application/page-chrome.store';
import { ASSISTANT_PANEL } from '../application/assistant-panel';

const TITLES: Readonly<Record<string, string>> = {
  '': 'Today',
  assistant: 'Assistant',
  map: 'Map',
  people: 'People',
  appearance: 'Appearance',
  account: 'Account',
};

@Component({
  selector: 'app-phone-bar',
  imports: [RouterLink],
  template: `
    <header class="bar">
      <button
        type="button"
        class="bar__button"
        aria-label="Open the menu"
        (click)="ui.drawerOpen.set(true)"
      >
        <svg
          viewBox="0 0 24 24"
          width="21"
          height="21"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          aria-hidden="true"
        >
          <path d="M4 8h16M4 16h11" />
        </svg>
        @if (waiting()) {
          <span class="bar__badge" aria-hidden="true"></span>
        }
      </button>
      <span class="bar__title">{{ title() }}</span>
      <span class="bar__end">
        <ng-content />
        @if (onAssistant()) {
          <a class="bar__button" routerLink="/assistant/new" aria-label="New conversation">
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              stroke-linejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h8M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </a>
        } @else {
          <button
            type="button"
            class="bar__button"
            aria-label="Search or ask"
            (click)="palette.open()"
          >
            <svg
              viewBox="0 0 24 24"
              width="20"
              height="20"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
              stroke-linecap="round"
              aria-hidden="true"
            >
              <path d="M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14Z" />
              <path d="M20 20l-4-4" />
            </svg>
          </button>
        }
      </span>
    </header>
  `,
  styles: `
    :host {
      display: block;
      position: sticky;
      top: 0;
      z-index: 6;
    }
    .bar {
      display: grid;
      grid-template-columns: 5.25rem 1fr 5.25rem;
      align-items: center;
      gap: 0.25rem;
      height: calc(2.9rem + var(--safe-top));
      padding: var(--safe-top) 0.35rem 0;
      background: color-mix(in srgb, var(--surface) 88%, transparent);
      backdrop-filter: blur(14px);
      -webkit-backdrop-filter: blur(14px);
      border-bottom: var(--border-width) solid var(--border);
    }
    .bar__button {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 2.5rem;
      height: 2.5rem;
      border: 0;
      border-radius: 0.6rem;
      background: transparent;
      color: var(--text);
      cursor: pointer;
    }
    .bar__badge {
      position: absolute;
      top: 0.55rem;
      right: 0.5rem;
      width: 0.5rem;
      height: 0.5rem;
      border-radius: 50%;
      background: var(--accent);
      box-shadow: 0 0 0 2px var(--surface);
    }
    .bar__title {
      overflow: hidden;
      font-size: 0.95rem;
      font-weight: 600;
      text-align: center;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .bar__end {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      min-width: 2.5rem;
    }
    @media (min-width: 768px) {
      :host {
        display: none;
      }
    }
  `,
})
export class PhoneBar {
  protected readonly ui = inject(LayoutStore);
  protected readonly palette = inject(CommandPaletteStore);
  private readonly chrome = inject(PageChromeStore);
  private readonly router = inject(Router);
  private readonly features = inject(HOMELAB_FEATURES, { optional: true }) ?? [];
  private readonly assistant = inject(ASSISTANT_PANEL, { optional: true });

  private readonly path = toSignal(
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url.split(/[?#]/)[0]),
    ),
    { initialValue: this.router.url.split(/[?#]/)[0] },
  );

  protected readonly waiting = computed(() => this.assistant?.waiting() ?? 0);
  protected readonly onAssistant = computed(() => this.path().startsWith('/assistant'));
  protected readonly title = computed(() => {
    const own = this.chrome.title();
    if (own) return own;
    const segment = this.path().split('/')[1] ?? '';
    if (segment in TITLES) return TITLES[segment];
    return this.features.find((f) => f.entry.path === `/${segment}`)?.label ?? 'Homelab';
  });
}
