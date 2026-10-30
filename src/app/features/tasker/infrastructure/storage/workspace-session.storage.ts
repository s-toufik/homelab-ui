import { Injectable, InjectionToken, inject } from '@angular/core';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import type { BlockFavorite } from '../../domain/block-favorite';
import { isBlockKind } from '../../domain/block-kind';
import { isLayoutNode, type LayoutNode } from '../../domain/pane-layout';
import { UNTITLED_WORKFLOW, sanitizeGraph, type WorkflowDocument } from '../../domain/workflow';

export interface DocumentDraft extends WorkflowDocument {
  readonly dirty: boolean;
  readonly persisted: boolean;
}

export interface WorkspaceSession {
  readonly layout: LayoutNode;
  readonly activeGroupId: string;
  readonly documents: readonly DocumentDraft[];
}

const SESSION_KEY = 'homelab-ui.tasker.workspace';
const LEGACY_WORKFLOW_KEY = 'homelab-ui.tasker.workflow';
const LEGACY_FAVORITES_KEY = 'homelab-ui.tasker.favorites';

export const TASKER_LOCAL_STORAGE = new InjectionToken<Storage | null>('TASKER_LOCAL_STORAGE', {
  factory: () => {
    try {
      return globalThis.localStorage ?? null;
    } catch {
      return null;
    }
  },
});

@Injectable({ providedIn: 'root' })
export class WorkspaceSessionStorage {
  private readonly storage = inject(TASKER_LOCAL_STORAGE);
  private readonly session = inject(GatewaySession);

  private get key(): string {
    const username = this.session.user()?.username;
    return username ? `${SESSION_KEY}.${username}` : SESSION_KEY;
  }

  read(): WorkspaceSession | null {
    const saved = readJson(this.storage, this.key) as Partial<WorkspaceSession> | null;
    if (!saved || !isLayoutNode(saved.layout) || !Array.isArray(saved.documents)) return null;
    const documents = saved.documents
      .filter((draft) => typeof draft?.id === 'string')
      .map((draft) => ({
        id: draft.id,
        name: typeof draft.name === 'string' ? draft.name : UNTITLED_WORKFLOW,
        ...sanitizeGraph(draft),
        dirty: draft.dirty === true,
        persisted: draft.persisted === true,
      }));
    return {
      layout: saved.layout,
      activeGroupId: typeof saved.activeGroupId === 'string' ? saved.activeGroupId : '',
      documents,
    };
  }

  write(session: WorkspaceSession): void {
    try {
      this.storage?.setItem(this.key, JSON.stringify(session));
    } catch {
      return;
    }
  }
}

@Injectable({ providedIn: 'root' })
export class LegacyTaskerStorage {
  private readonly storage = inject(TASKER_LOCAL_STORAGE);

  takeWorkflow(): Omit<WorkflowDocument, 'id'> | null {
    const saved = readJson(this.storage, LEGACY_WORKFLOW_KEY) as {
      name?: unknown;
      blocks?: unknown;
      connections?: unknown;
    } | null;
    this.remove(LEGACY_WORKFLOW_KEY);
    if (!saved) return null;
    const graph = sanitizeGraph(saved);
    if (graph.blocks.length === 0) return null;
    return { name: typeof saved.name === 'string' ? saved.name : UNTITLED_WORKFLOW, ...graph };
  }

  peekFavorites(): BlockFavorite[] {
    const saved = readJson(this.storage, LEGACY_FAVORITES_KEY);
    if (!Array.isArray(saved)) return [];
    return saved.filter(
      (favorite: BlockFavorite) =>
        typeof favorite?.id === 'string' && isBlockKind(favorite?.config?.kind),
    );
  }

  clearFavorites(): void {
    this.remove(LEGACY_FAVORITES_KEY);
  }

  private remove(key: string): void {
    try {
      this.storage?.removeItem(key);
    } catch {
      return;
    }
  }
}

function readJson(storage: Storage | null, key: string): unknown {
  try {
    return JSON.parse(storage?.getItem(key) ?? 'null');
  } catch {
    return null;
  }
}
