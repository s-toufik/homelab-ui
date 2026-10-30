import type { BlockFavorite } from './block-favorite';
import type { WorkflowDocument, WorkflowSummary } from './workflow';

export interface WorkflowRepository {
  list(): Promise<WorkflowSummary[]>;
  get(id: string): Promise<WorkflowDocument>;
  save(document: WorkflowDocument): Promise<WorkflowSummary>;
  remove(id: string): Promise<void>;
}

export interface BlockFavoriteRepository {
  list(): Promise<BlockFavorite[]>;
  save(favorite: BlockFavorite): Promise<void>;
  remove(id: string): Promise<void>;
}
