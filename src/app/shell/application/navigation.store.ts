import { Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import { NAV_SECTIONS, navSection, type NavSection } from '../domain/navigation';
import { AppsStore } from './apps.store';
import { HOMELAB_FEATURES } from './homelab-features';

export const NAV_STORAGE = new InjectionToken<Storage | null>('NAV_STORAGE', {
  factory: () => {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  },
});

const COLLAPSED_KEY = 'homelab-ui.nav-collapsed';

@Injectable({ providedIn: 'root' })
export class NavigationStore {
  private readonly apps = inject(AppsStore);
  private readonly storage = inject(NAV_STORAGE);
  private readonly features = inject(HOMELAB_FEATURES, { optional: true }) ?? [];

  readonly collapsed = signal<ReadonlySet<NavSection>>(this.readCollapsed());

  readonly sections = computed(() =>
    NAV_SECTIONS.map((section) => ({
      section,
      pages: this.apps.pages().filter((page) => {
        const feature = this.features.find((f) => f.id === page.id);
        return feature && navSection(feature) === section;
      }),
    })).filter((entry) => entry.pages.length > 0),
  );

  toggle(section: NavSection): void {
    this.collapsed.update((current) => {
      const next = new Set(current);
      if (next.has(section)) next.delete(section);
      else next.add(section);
      try {
        this.storage?.setItem(COLLAPSED_KEY, JSON.stringify([...next]));
      } catch {
        return next;
      }
      return next;
    });
  }

  private readCollapsed(): ReadonlySet<NavSection> {
    try {
      const saved = JSON.parse(this.storage?.getItem(COLLAPSED_KEY) ?? '[]');
      return new Set(
        (Array.isArray(saved) ? saved : []).filter((s): s is NavSection =>
          (NAV_SECTIONS as readonly string[]).includes(s),
        ),
      );
    } catch {
      return new Set();
    }
  }
}
