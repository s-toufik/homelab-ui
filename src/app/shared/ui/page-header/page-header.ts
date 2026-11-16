import { Component, computed, inject, input } from '@angular/core';
import { Router } from '@angular/router';
import { HOMELAB_FEATURES } from '@shell/application/homelab-features';
import type { Hue } from '@shell/domain/homelab-feature';
import { FeatureIcon } from '@shell/feature-icon/feature-icon';

@Component({
  selector: 'app-page-header',
  imports: [FeatureIcon],
  host: { '[class]': "'hue-' + tone()" },
  template: `
    <header class="page-header">
      <div class="page-header__text">
        <p class="page-header__eyebrow">
          @if (feature(); as current) {
            <app-feature-icon [paths]="current.icon" [size]="13" />
          }
          {{ eyebrow() }}
        </p>
        <h1 class="page-header__title hl-display hl-flourish">{{ title() }}</h1>
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
    :host {
      display: block;
    }
    .page-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 0.75rem 1rem;
    }
    .page-header__text {
      flex: 1 1 18rem;
      min-width: 0;
    }
    .page-header__eyebrow {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      margin: 0 0 0.35rem;
      font-family: var(--font-caps, var(--font-sans));
      font-size: var(--cap-size, 0.72rem);
      font-weight: 600;
      letter-spacing: var(--cap-tracking, 0.09em);
      text-transform: var(--cap-transform, uppercase);
      color: var(--cap-color, var(--h));
    }
    .page-header__title {
      margin: 0;
      font-size: clamp(1.5rem, 2.4vw, 1.9rem);
      line-height: 1.15;
      font-weight: 650;
      color: var(--text);
    }
    .page-header__summary {
      margin: 0.35rem 0 0;
      font-size: 0.9rem;
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
  private readonly router = inject(Router);
  private readonly features = inject(HOMELAB_FEATURES, { optional: true }) ?? [];

  readonly eyebrow = input('Homelab');
  readonly title = input.required<string>();
  readonly summary = input('');
  readonly hue = input<Hue | null>(null);

  protected readonly feature = computed(() => {
    const path = this.router.url.split(/[?#]/)[0];
    return (
      this.features.find(
        (feature) => path === feature.entry.path || path.startsWith(`${feature.entry.path}/`),
      ) ?? null
    );
  });

  protected readonly tone = computed<Hue>(() => this.hue() ?? this.feature()?.hue ?? 'blue');
}
