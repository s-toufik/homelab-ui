import { entryIds } from './grouping';
import type { GroupConfig, WorkflowBlock, WorkflowGraph } from './workflow';

export interface GraphExecutionHooks {
  readonly execute: (
    block: WorkflowBlock,
    input: unknown,
    outputs: ReadonlyMap<string, unknown>,
  ) => Promise<unknown>;
  readonly onStart?: (id: string) => void;
  readonly onSuccess?: (id: string, output: unknown) => void;
  readonly onError?: (id: string, error: Error) => void;
}

export interface GraphExecution {
  readonly outputs: ReadonlyMap<string, unknown>;
  readonly errors: ReadonlyMap<string, Error>;
}

export async function executeGraph(
  graph: WorkflowGraph,
  seeds: ReadonlyMap<string, unknown>,
  hooks: GraphExecutionHooks,
): Promise<GraphExecution> {
  const byId = new Map(graph.blocks.map((block) => [block.id, block]));
  const outputs = new Map<string, unknown>();
  const errors = new Map<string, Error>();
  const visited = new Set<string>();
  const queue = [...seeds.keys()];

  while (queue.length > 0) {
    const id = queue.shift()!;
    const block = byId.get(id);
    if (!block || visited.has(id)) continue;
    visited.add(id);

    const input = seeds.has(id) ? seeds.get(id) : upstreamOutput(graph, id, outputs);
    hooks.onStart?.(id);
    try {
      const output = await hooks.execute(block, input, outputs);
      outputs.set(id, output);
      hooks.onSuccess?.(id, output);
      for (const connection of graph.connections) {
        if (connection.fromId === id) queue.push(connection.toId);
      }
    } catch (error) {
      const failure = error instanceof Error ? error : new Error(String(error));
      errors.set(id, failure);
      hooks.onError?.(id, failure);
    }
  }

  return { outputs, errors };
}

export function upstreamOutput(
  graph: WorkflowGraph,
  id: string,
  outputs: ReadonlyMap<string, unknown>,
): unknown {
  const incoming = graph.connections.find(
    (connection) => connection.toId === id && outputs.has(connection.fromId),
  );
  return incoming ? outputs.get(incoming.fromId) : undefined;
}

export function rootSeeds(graph: WorkflowGraph): Map<string, unknown> {
  const hasIncoming = (id: string) => graph.connections.some((c) => c.toId === id);
  return new Map(
    graph.blocks
      .filter(
        (block) =>
          block.config.kind === 'trigger' ||
          (block.config.kind === 'group' && !hasIncoming(block.id)),
      )
      .map((block) => [block.id, null]),
  );
}

export function groupSeeds(config: GroupConfig, input: unknown): Map<string, unknown> {
  const known = new Set(config.blocks.map((block) => block.id));
  const inputs = config.inputIds.filter((id) => known.has(id));
  const seeds = new Map<string, unknown>();
  for (const id of inputs.length ? inputs : entryIds(config)) seeds.set(id, input);
  for (const block of config.blocks) {
    if (block.config.kind === 'trigger' && !seeds.has(block.id)) seeds.set(block.id, null);
  }
  return seeds;
}

export function groupOutput(config: GroupConfig, outputs: ReadonlyMap<string, unknown>): unknown {
  const values = config.outputIds.filter((id) => outputs.has(id)).map((id) => outputs.get(id));
  if (values.length === 0) return undefined;
  return values.length === 1 ? values[0] : values;
}
