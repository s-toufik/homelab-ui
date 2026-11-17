import { Injectable, computed, inject, signal } from '@angular/core';
import { resolveCast, type CastChoice, type CastId } from '../domain/agent-cast';
import { CastPreferencesStorage } from '../infrastructure/cast-preferences.storage';
import { CAST_ACCOUNT } from './cast-account';
import { ThemeStore } from './theme.store';

@Injectable({ providedIn: 'root' })
export class CastStore {
  private readonly storage = inject(CastPreferencesStorage);
  private readonly account = inject(CAST_ACCOUNT, { optional: true });
  private readonly theme = inject(ThemeStore);

  readonly choice = signal<CastChoice>(this.storage.read());
  readonly active = computed<CastId>(() => resolveCast(this.choice(), this.theme.active()));

  choose(choice: CastChoice): void {
    this.choice.set(choice);
    this.storage.write(choice);
    void this.account?.write(choice).catch(() => undefined);
  }

  async loadFromAccount(): Promise<void> {
    const saved = await this.account?.read().catch(() => null);
    if (!saved || saved === this.choice()) return;
    this.choice.set(saved);
    this.storage.write(saved);
  }
}
