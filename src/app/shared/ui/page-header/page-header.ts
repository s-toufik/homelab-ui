import { Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  template: `
    <header class="page-header">
      <div class="page-header__text">
        <p class="page-header__eyebrow">{{ eyebrow() }}</p>
        <h1 class="page-header__title">{{ title() }}</h1>
        @if (summary()) {
          <p class="page-header__summary">{{ summary() }}</p>
        }
        <ng-content select="[summary]" />
      </div>
      <div class="page-header__actions">
        <ng-content />
      </div>
    </header>
  `,
  styles: `
    .page-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 1rem;
    }
    .page-header__eyebrow {
      margin: 0 0 0.6rem;
      font-size: 0.75rem;
      font-weight: 600;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      color: var(--accent);
    }
    .page-header__title {
      margin: 0;
      font-size: clamp(1.6rem, 3vw, 2.1rem);
      font-weight: 500;
      letter-spacing: -0.01em;
      color: var(--text);
    }
    .page-header__summary {
      margin: 0.5rem 0 0;
      font-size: 0.95rem;
      color: var(--text-muted);
    }
    .page-header__actions {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.5rem;
    }
  `,
})
export class PageHeader {
  readonly eyebrow = input('Homelab');
  readonly title = input.required<string>();
  readonly summary = input('');
}
