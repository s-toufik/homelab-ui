import {
  DestroyRef,
  Injectable,
  InjectionToken,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import {
  resolveTheme,
  themeOption,
  type ThemeChoice,
  type ThemeId,
} from '../domain/theme-preferences';
import { ThemePreferencesStorage } from '../infrastructure/theme-preferences.storage';
import { THEME_ACCOUNT } from './theme-account';

export const COLOR_SCHEME_QUERY = new InjectionToken<MediaQueryList | null>('COLOR_SCHEME_QUERY', {
  factory: () => globalThis.matchMedia?.('(prefers-color-scheme: dark)') ?? null,
});

@Injectable({ providedIn: 'root' })
export class ThemeStore {
  private readonly storage = inject(ThemePreferencesStorage);
  private readonly account = inject(THEME_ACCOUNT, { optional: true });
  private readonly query = inject(COLOR_SCHEME_QUERY);

  readonly choice = signal<ThemeChoice>(this.storage.read().theme);
  readonly prefersDark = signal(this.query?.matches ?? false);
  readonly active = computed<ThemeId>(() => resolveTheme(this.choice(), this.prefersDark()));

  constructor() {
    const onChange = (event: MediaQueryListEvent) => this.prefersDark.set(event.matches);
    this.query?.addEventListener?.('change', onChange);
    inject(DestroyRef).onDestroy(() => this.query?.removeEventListener?.('change', onChange));

    effect(() => {
      const root = globalThis.document?.documentElement;
      root?.setAttribute('data-theme', this.choice());
      globalThis.document
        ?.querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', themeOption(this.active()).surface);
    });
  }

  choose(choice: ThemeChoice): void {
    this.choice.set(choice);
    this.storage.write({ theme: choice });
    void this.account?.write(choice).catch(() => undefined);
  }

  async loadFromAccount(): Promise<void> {
    const saved = await this.account?.read().catch(() => null);
    if (!saved || saved === this.choice()) return;
    this.choice.set(saved);
    this.storage.write({ theme: saved });
  }
}
