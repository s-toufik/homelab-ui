import { NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, OnInit, computed, inject, signal, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import { RouterLink } from '@angular/router';
import { FeatureStatusStore } from '@shell/application/feature-status.store';
import { HOMELAB_FEATURES } from '@shell/application/homelab-features';
import { FEATURE_CATEGORIES, type HomelabFeature } from '@shell/domain/homelab-feature';
import { FeatureIcon } from '@shell/feature-icon/feature-icon';

const SEARCH_FROM = 6;

const STATUS_LABEL = { checking: 'Checking', online: 'Online', offline: 'Unreachable' } as const;

function greeting(hour: number): string {
  if (hour < 5) return 'I wish you a Good night';
  if (hour < 12) return 'I wish you a Good morning';
  if (hour < 18) return 'I wish you a Good afternoon';
  return 'I wish you a Good evening';
}

function matches(feature: HomelabFeature, query: string): boolean {
  const text = `${feature.label} ${feature.description} ${feature.category}`.toLowerCase();
  return query
    .toLowerCase()
    .split(/\s+/)
    .every((word) => text.includes(word));
}

@Component({
  selector: 'app-home-page',
  imports: [RouterLink, FormsModule, NgTemplateOutlet, FeatureIcon],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
  host: { '(document:keydown)': 'focusSearch($event)' },
})
export class HomePage implements OnInit {
  private readonly features = inject(HOMELAB_FEATURES, { optional: true }) ?? [];
  private readonly status = inject(FeatureStatusStore);
  private readonly search = viewChild<ElementRef<HTMLInputElement>>('search');

  protected readonly greeting = greeting(new Date().getHours());
  protected readonly host = inject(HomelabServer).host;
  protected readonly statusLabel = STATUS_LABEL;
  protected readonly showSearch = this.features.length >= SEARCH_FROM;
  protected readonly query = signal('');
  protected readonly statuses = this.status.statuses;

  protected readonly sections = computed(() => {
    const query = this.query().trim();
    return FEATURE_CATEGORIES.map((category) => ({
      category,
      features: this.features.filter(
        (feature) => feature.category === category && (!query || matches(feature, query)),
      ),
    })).filter((section) => section.features.length > 0);
  });

  protected readonly summary = computed(() => {
    const summary = this.status.summary();
    return summary ? `${summary.online} of ${summary.total} reachable` : 'Checking…';
  });

  ngOnInit(): void {
    void this.status.refresh();
  }

  protected focusSearch(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const typing = target?.closest('input, textarea, select, [contenteditable]');
    const search = this.search();
    if (event.key === '/' && !typing && search) {
      event.preventDefault();
      search.nativeElement.focus();
    }
  }
}
