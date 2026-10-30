import { Injectable, inject } from '@angular/core';
import type { BlockFavorite } from '../../domain/block-favorite';
import { isBlockKind } from '../../domain/block-kind';
import type { BlockFavoriteRepository } from '../../domain/repositories';
import { PostgrestClient } from './postgrest-client';

const UPSERT = { Prefer: 'resolution=merge-duplicates,return=minimal' };

@Injectable({ providedIn: 'root' })
export class PostgrestBlockFavoriteRepository implements BlockFavoriteRepository {
  private readonly client = inject(PostgrestClient);

  async list(): Promise<BlockFavorite[]> {
    const rows = await this.client.request<BlockFavorite[]>(
      '/block_favorites?select=id,name,config&order=created_at.asc',
    );
    return rows.filter((row) => isBlockKind(row?.config?.kind));
  }

  async save(favorite: BlockFavorite): Promise<void> {
    await this.client.request('/block_favorites', {
      method: 'POST',
      headers: UPSERT,
      body: JSON.stringify(favorite),
    });
  }

  async remove(id: string): Promise<void> {
    await this.client.request(`/block_favorites?id=eq.${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  }
}
