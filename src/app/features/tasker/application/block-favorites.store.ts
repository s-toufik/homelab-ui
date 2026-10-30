import { Injectable, inject, signal } from '@angular/core';
import type { BlockFavorite } from '../domain/block-favorite';
import type { BlockConfig } from '../domain/workflow';
import { LegacyTaskerStorage } from '../infrastructure/storage/workspace-session.storage';
import { BLOCK_FAVORITE_REPOSITORY, TASKER_ID } from './tasker-tokens';
import type { ListState } from './workspace.store';

@Injectable({ providedIn: 'root' })
export class BlockFavoritesStore {
  private readonly repository = inject(BLOCK_FAVORITE_REPOSITORY);
  private readonly legacy = inject(LegacyTaskerStorage);
  private readonly newId = inject(TASKER_ID);

  readonly favorites = signal<readonly BlockFavorite[]>([]);
  readonly state = signal<ListState>('loading');
  readonly error = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.state.set('loading');
    this.error.set(null);
    try {
      const legacy = this.legacy.peekFavorites();
      for (const favorite of legacy) await this.repository.save(favorite);
      if (legacy.length > 0) this.legacy.clearFavorites();
      this.favorites.set(await this.repository.list());
      this.state.set('ready');
    } catch (error) {
      this.error.set((error as Error).message);
      this.state.set('error');
    }
  }

  async add(name: string, config: BlockConfig): Promise<boolean> {
    const favorite: BlockFavorite = { id: this.newId(), name, config };
    try {
      await this.repository.save(favorite);
      this.favorites.update((favorites) => [...favorites, favorite]);
      this.error.set(null);
      return true;
    } catch (error) {
      this.error.set((error as Error).message);
      return false;
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.repository.remove(id);
      this.favorites.update((favorites) => favorites.filter((favorite) => favorite.id !== id));
    } catch (error) {
      this.error.set((error as Error).message);
    }
  }
}
