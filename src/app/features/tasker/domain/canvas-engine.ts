import type { BlockResult, WorkflowBlock, WorkflowConnection } from './workflow';

export interface CanvasEngineState {
  readonly blocks: readonly WorkflowBlock[];
  readonly connections: readonly WorkflowConnection[];
  readonly selectedIds: readonly string[];
  readonly results: Readonly<Record<string, BlockResult>>;
}

export interface CanvasEngineCallbacks {
  readonly onMove: (id: string, x: number, y: number) => void;
  readonly onConnect: (fromId: string, toId: string, suggestedId?: string) => void;
  readonly onDisconnect: (connectionId: string) => void;
  readonly onSelect: (id: string | null, additive: boolean) => void;
}

export interface CanvasEngine {
  mount(host: HTMLElement, callbacks: CanvasEngineCallbacks): void | Promise<void>;
  sync(state: CanvasEngineState): void;
  fitView(): void | Promise<void>;
  destroy(): void;
}
