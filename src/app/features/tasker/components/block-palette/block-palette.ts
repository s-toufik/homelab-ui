import { Component, inject } from '@angular/core';
import { FeatureIcon } from '@shell/feature-icon/feature-icon';
import { BlockFavoritesStore } from '../../application/block-favorites.store';
import { WorkspaceStore } from '../../application/workspace.store';
import { CREATABLE_BLOCK_KINDS, blockKindMeta } from '../../domain/block-kind';
import type { BlockFavorite } from '../../domain/block-favorite';

@Component({
  selector: 'app-block-palette',
  imports: [FeatureIcon],
  templateUrl: './block-palette.html',
  styleUrl: './block-palette.scss',
})
export class BlockPalette {
  protected readonly workspace = inject(WorkspaceStore);
  protected readonly favorites = inject(BlockFavoritesStore);
  protected readonly kinds = CREATABLE_BLOCK_KINDS;

  protected kindMeta(favorite: BlockFavorite) {
    return blockKindMeta(favorite.config.kind);
  }
}
