import { Injectable, inject, signal } from '@angular/core';
import type { CenterStyleId } from '../domain/center-style';
import { CenterStyleStorage } from '../infrastructure/center-style.storage';
import { CENTER_ACCOUNT } from './center-account';

/* The Center's look, chosen in Appearance: kept on this device and, when signed in, on the account. */
@Injectable({ providedIn: 'root' })
export class CenterStyleStore {
  private readonly storage = inject(CenterStyleStorage);
  private readonly account = inject(CENTER_ACCOUNT, { optional: true });

  readonly style = signal<CenterStyleId>(this.storage.read());

  choose(style: CenterStyleId): void {
    this.style.set(style);
    this.storage.write(style);
    void this.account?.write(style).catch(() => undefined);
  }

  async loadFromAccount(): Promise<void> {
    const saved = await this.account?.read().catch(() => null);
    if (!saved || saved === this.style()) return;
    this.style.set(saved);
    this.storage.write(saved);
  }
}
