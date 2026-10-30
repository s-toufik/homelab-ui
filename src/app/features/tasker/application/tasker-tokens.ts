import { InjectionToken } from '@angular/core';
import { newId } from '@shared/utils/uuid';
import type { BlockFavoriteRepository, WorkflowRepository } from '../domain/repositories';

export const WORKFLOW_REPOSITORY = new InjectionToken<WorkflowRepository>('WORKFLOW_REPOSITORY');

export const BLOCK_FAVORITE_REPOSITORY = new InjectionToken<BlockFavoriteRepository>(
  'BLOCK_FAVORITE_REPOSITORY',
);

export const TASKER_CONFIRM = new InjectionToken<(message: string) => boolean>('TASKER_CONFIRM', {
  factory: () => (message) => globalThis.confirm?.(message) ?? true,
});

export const TASKER_ID = new InjectionToken<() => string>('TASKER_ID', {
  factory: () => newId,
});
