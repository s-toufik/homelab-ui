import { computed, signal } from '@angular/core';
import type { BlockKind } from '../domain/block-kind';
import { executeGraph, rootSeeds, upstreamOutput } from '../domain/graph-execution';
import { groupBlocks, ungroupBlock } from '../domain/grouping';
import {
  defaultConfig,
  type BlockConfig,
  type BlockResult,
  type WorkflowBlock,
  type WorkflowConnection,
  type WorkflowDocument,
  type WorkflowGraph,
} from '../domain/workflow';
import type { DocumentDraft } from '../infrastructure/storage/workspace-session.storage';
import type { BlockExecutor } from './block-executor';

const COLUMN_GAP = 260;
const ROW_GAP = 130;

export class WorkflowDocumentStore {
  readonly id: string;
  readonly name;
  readonly blocks;
  readonly connections;
  readonly selectedIds = signal<readonly string[]>([]);
  readonly results = signal<Readonly<Record<string, BlockResult>>>({});
  readonly running = signal(false);
  readonly dirty;
  readonly persisted;
  readonly saving = signal(false);
  readonly saveError = signal<string | null>(null);

  readonly selectedBlocks = computed(() => {
    const ids = new Set(this.selectedIds());
    return this.blocks().filter((block) => ids.has(block.id));
  });
  readonly selectedBlock = computed(() => {
    const selected = this.selectedBlocks();
    return selected.length === 1 ? selected[0] : null;
  });

  constructor(
    draft: DocumentDraft,
    private readonly executor: BlockExecutor,
    private readonly newId: () => string,
  ) {
    this.id = draft.id;
    this.name = signal(draft.name);
    this.blocks = signal<readonly WorkflowBlock[]>(draft.blocks);
    this.connections = signal<readonly WorkflowConnection[]>(draft.connections);
    this.dirty = signal(draft.dirty);
    this.persisted = signal(draft.persisted);
  }

  rename(name: string): void {
    this.name.set(name);
    this.touch();
  }

  addBlock(kind: BlockKind): string {
    return this.addBlockWithConfig(defaultConfig(kind));
  }

  addBlockWithConfig(config: BlockConfig): string {
    const index = this.blocks().length;
    const block: WorkflowBlock = {
      id: this.newId(),
      x: 40 + (index % 4) * COLUMN_GAP,
      y: 40 + Math.floor(index / 4) * 150,
      config,
    };
    this.blocks.update((blocks) => [...blocks, block]);
    this.selectedIds.set([block.id]);
    this.touch();
    return block.id;
  }

  moveBlock(id: string, x: number, y: number): void {
    const block = this.blocks().find((candidate) => candidate.id === id);
    if (!block || (block.x === x && block.y === y)) return;
    this.blocks.update((blocks) =>
      blocks.map((candidate) => (candidate.id === id ? { ...candidate, x, y } : candidate)),
    );
    this.touch();
  }

  removeBlock(id: string): void {
    this.removeBlocks([id]);
  }

  removeSelected(): void {
    this.removeBlocks(this.selectedIds());
  }

  updateConfig(id: string, config: BlockConfig): void {
    this.blocks.update((blocks) =>
      blocks.map((block) => (block.id === id ? { ...block, config } : block)),
    );
    this.touch();
  }

  select(id: string | null, additive = false): void {
    if (id === null) {
      this.selectedIds.set([]);
      return;
    }
    if (!additive) {
      this.selectedIds.set([id]);
      return;
    }
    this.selectedIds.update((ids) =>
      ids.includes(id) ? ids.filter((candidate) => candidate !== id) : [...ids, id],
    );
  }

  connect(fromId: string, toId: string, suggestedId?: string): void {
    if (fromId === toId) return;
    const exists = this.connections().some(
      (connection) => connection.fromId === fromId && connection.toId === toId,
    );
    if (exists) return;
    this.connections.update((connections) => [
      ...connections,
      { id: suggestedId ?? this.newId(), fromId, toId },
    ]);
    this.touch();
  }

  disconnect(id: string): void {
    if (!this.connections().some((connection) => connection.id === id)) return;
    this.connections.update((connections) =>
      connections.filter((connection) => connection.id !== id),
    );
    this.touch();
  }

  groupSelected(name: string): string | null {
    const grouped = groupBlocks(this.graph(), this.selectedIds(), name, this.newId);
    if (!grouped) return null;
    this.applyGraph(grouped);
    this.selectedIds.set([grouped.groupId]);
    return grouped.groupId;
  }

  ungroup(id: string): void {
    const before = new Set(this.blocks().map((block) => block.id));
    const expanded = ungroupBlock(this.graph(), id, this.newId);
    if (!expanded) return;
    this.applyGraph(expanded);
    this.selectedIds.set(
      expanded.blocks.filter((block) => !before.has(block.id)).map((block) => block.id),
    );
  }

  autoLayout(): void {
    const blocks = this.blocks();
    const connections = this.connections();
    const outgoingOf = (id: string) =>
      connections.filter((connection) => connection.fromId === id).map((c) => c.toId);

    const depth = new Map<string, number>();
    const queue = blocks
      .filter((block) => !connections.some((connection) => connection.toId === block.id))
      .map((block) => ({ id: block.id, level: 0 }));
    const visited = new Set<string>();

    while (queue.length > 0) {
      const { id, level } = queue.shift()!;
      if (visited.has(id)) continue;
      visited.add(id);
      depth.set(id, level);
      for (const next of outgoingOf(id)) queue.push({ id: next, level: level + 1 });
    }

    const rows = new Map<number, number>();
    this.blocks.set(
      blocks.map((block) => {
        const level = depth.get(block.id) ?? 0;
        const row = rows.get(level) ?? 0;
        rows.set(level, row + 1);
        return { ...block, x: 40 + level * COLUMN_GAP, y: 40 + row * ROW_GAP };
      }),
    );
    this.touch();
  }

  async run(): Promise<void> {
    if (this.running()) return;
    this.running.set(true);
    this.results.set({});
    const graph = this.graph();
    try {
      await executeGraph(graph, rootSeeds(graph), this.hooks());
    } finally {
      this.running.set(false);
    }
  }

  async runOne(id: string): Promise<void> {
    const graph = this.graph();
    const block = graph.blocks.find((candidate) => candidate.id === id);
    if (!block) return;
    const outputs = this.outputs();
    const input = upstreamOutput(graph, id, outputs);
    await executeGraph({ blocks: [block], connections: [] }, new Map([[id, input]]), {
      ...this.hooks(),
      execute: (target, blockInput) => this.executor.execute(target.config, blockInput, outputs),
    });
  }

  toDocument(): WorkflowDocument {
    return {
      id: this.id,
      name: this.name(),
      blocks: this.blocks(),
      connections: this.connections(),
    };
  }

  snapshot(): DocumentDraft {
    return { ...this.toDocument(), dirty: this.dirty(), persisted: this.persisted() };
  }

  markSaved(): void {
    this.dirty.set(false);
    this.persisted.set(true);
    this.saveError.set(null);
  }

  markUnpersisted(): void {
    this.persisted.set(false);
    this.dirty.set(true);
  }

  private hooks() {
    return {
      execute: (block: WorkflowBlock, input: unknown, outputs: ReadonlyMap<string, unknown>) =>
        this.executor.execute(block.config, input, outputs),
      onStart: (id: string) => this.setResult(id, { status: 'running' }),
      onSuccess: (id: string, output: unknown) => this.setResult(id, { status: 'success', output }),
      onError: (id: string, error: Error) =>
        this.setResult(id, { status: 'error', error: error.message }),
    };
  }

  private outputs(): Map<string, unknown> {
    return new Map(
      Object.entries(this.results())
        .filter(([, result]) => result.status === 'success')
        .map(([id, result]) => [id, result.output]),
    );
  }

  private removeBlocks(ids: readonly string[]): void {
    if (ids.length === 0) return;
    const removed = new Set(ids);
    this.blocks.update((blocks) => blocks.filter((block) => !removed.has(block.id)));
    this.connections.update((connections) =>
      connections.filter(
        (connection) => !removed.has(connection.fromId) && !removed.has(connection.toId),
      ),
    );
    this.selectedIds.update((selected) => selected.filter((id) => !removed.has(id)));
    this.touch();
  }

  private graph(): WorkflowGraph {
    return { blocks: this.blocks(), connections: this.connections() };
  }

  private applyGraph(graph: WorkflowGraph): void {
    this.blocks.set(graph.blocks);
    this.connections.set(graph.connections);
    this.touch();
  }

  private setResult(id: string, result: BlockResult): void {
    this.results.update((current) => ({ ...current, [id]: result }));
  }

  private touch(): void {
    this.dirty.set(true);
  }
}
