import type { GroupConfig, WorkflowBlock, WorkflowConnection, WorkflowGraph } from './workflow';

export interface GroupedGraph extends WorkflowGraph {
  readonly groupId: string;
}

export function groupBlocks(
  graph: WorkflowGraph,
  ids: readonly string[],
  name: string,
  newId: () => string,
): GroupedGraph | null {
  const selected = new Set(ids.filter((id) => graph.blocks.some((block) => block.id === id)));
  if (selected.size < 2) return null;

  const members = graph.blocks.filter((block) => selected.has(block.id));
  const originX = Math.min(...members.map((block) => block.x));
  const originY = Math.min(...members.map((block) => block.y));
  const inner = members.map((block) => ({ ...block, x: block.x - originX, y: block.y - originY }));

  const isInside = (id: string) => selected.has(id);
  const internal = graph.connections.filter((c) => isInside(c.fromId) && isInside(c.toId));
  const incoming = graph.connections.filter((c) => !isInside(c.fromId) && isInside(c.toId));
  const outgoing = graph.connections.filter((c) => isInside(c.fromId) && !isInside(c.toId));
  const untouched = graph.connections.filter((c) => !isInside(c.fromId) && !isInside(c.toId));

  const inputIds = unique(incoming.map((c) => c.toId));
  const outputIds = unique(outgoing.map((c) => c.fromId));
  const groupId = newId();
  const config: GroupConfig = {
    kind: 'group',
    name,
    blocks: inner,
    connections: internal,
    inputIds: inputIds.length ? inputIds : entryIds({ blocks: inner, connections: internal }),
    outputIds: outputIds.length ? outputIds : exitIds({ blocks: inner, connections: internal }),
  };

  const rewired: WorkflowConnection[] = [
    ...unique(incoming.map((c) => c.fromId)).map((fromId) => ({
      id: newId(),
      fromId,
      toId: groupId,
    })),
    ...unique(outgoing.map((c) => c.toId)).map((toId) => ({ id: newId(), fromId: groupId, toId })),
  ];

  return {
    groupId,
    blocks: [
      ...graph.blocks.filter((block) => !selected.has(block.id)),
      { id: groupId, x: originX, y: originY, config },
    ],
    connections: [...untouched, ...rewired],
  };
}

export function ungroupBlock(
  graph: WorkflowGraph,
  groupId: string,
  newId: () => string,
): WorkflowGraph | null {
  const group = graph.blocks.find((block) => block.id === groupId);
  if (!group || group.config.kind !== 'group') return null;
  const config = group.config;

  const idMap = new Map(config.blocks.map((block) => [block.id, newId()]));
  const mapId = (id: string) => idMap.get(id)!;
  const known = (id: string) => idMap.has(id);

  const blocks: WorkflowBlock[] = config.blocks.map((block) => ({
    ...block,
    id: mapId(block.id),
    x: group.x + block.x,
    y: group.y + block.y,
  }));
  const inner: WorkflowConnection[] = config.connections
    .filter((c) => known(c.fromId) && known(c.toId))
    .map((c) => ({ id: newId(), fromId: mapId(c.fromId), toId: mapId(c.toId) }));

  const inputs = config.inputIds.filter(known).map(mapId);
  const outputs = config.outputIds.filter(known).map(mapId);
  const incoming = graph.connections.filter((c) => c.toId === groupId);
  const outgoing = graph.connections.filter((c) => c.fromId === groupId);
  const others = graph.connections.filter((c) => c.toId !== groupId && c.fromId !== groupId);

  const rewired: WorkflowConnection[] = [
    ...incoming.flatMap((c) => inputs.map((toId) => ({ id: newId(), fromId: c.fromId, toId }))),
    ...outgoing.flatMap((c) => outputs.map((fromId) => ({ id: newId(), fromId, toId: c.toId }))),
  ];

  return {
    blocks: [...graph.blocks.filter((block) => block.id !== groupId), ...blocks],
    connections: [...others, ...inner, ...rewired],
  };
}

export function entryIds(graph: WorkflowGraph): string[] {
  return graph.blocks
    .filter((block) => !graph.connections.some((c) => c.toId === block.id))
    .map((block) => block.id);
}

export function exitIds(graph: WorkflowGraph): string[] {
  return graph.blocks
    .filter((block) => !graph.connections.some((c) => c.fromId === block.id))
    .map((block) => block.id);
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}
