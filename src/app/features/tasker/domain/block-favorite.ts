import type { BlockConfig } from './workflow';

export interface BlockFavorite {
  readonly id: string;
  readonly name: string;
  readonly config: BlockConfig;
}
