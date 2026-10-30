import { groupBlocks, ungroupBlock } from './grouping';
import type { WorkflowBlock, WorkflowGraph } from './workflow';

function block(id: string, x: number, y: number): WorkflowBlock {
  return { id, x, y, config: { kind: 'code', script: `return '${id}';` } };
}

function ids(): () => string {
  let next = 0;
  return () => `id${++next}`;
}

const graph: WorkflowGraph = {
  blocks: [block('start', 0, 0), block('a', 300, 100), block('b', 600, 120), block('end', 900, 0)],
  connections: [
    { id: 'c1', fromId: 'start', toId: 'a' },
    { id: 'c2', fromId: 'a', toId: 'b' },
    { id: 'c3', fromId: 'b', toId: 'end' },
  ],
};

describe('grouping', () => {
  it('collapses the selection into one block and rewires its edges', () => {
    const grouped = groupBlocks(graph, ['a', 'b'], 'Pair', ids())!;
    const group = grouped.blocks.find((candidate) => candidate.id === grouped.groupId)!;

    expect(grouped.blocks.map((candidate) => candidate.id)).toEqual(['start', 'end', 'id1']);
    expect(group).toMatchObject({ x: 300, y: 100 });
    expect(group.config).toMatchObject({
      kind: 'group',
      name: 'Pair',
      inputIds: ['a'],
      outputIds: ['b'],
      connections: [{ id: 'c2', fromId: 'a', toId: 'b' }],
    });
    expect(group.config.kind === 'group' && group.config.blocks[1]).toMatchObject({
      id: 'b',
      x: 300,
      y: 20,
    });
    expect(grouped.connections).toEqual([
      { id: 'id2', fromId: 'start', toId: 'id1' },
      { id: 'id3', fromId: 'id1', toId: 'end' },
    ]);
  });

  it('needs at least two blocks', () => {
    expect(groupBlocks(graph, ['a'], 'Solo', ids())).toBeNull();
  });

  it('expands a group back with fresh ids and restored positions', () => {
    const next = ids();
    const grouped = groupBlocks(graph, ['a', 'b'], 'Pair', next)!;

    const expanded = ungroupBlock(grouped, grouped.groupId, next)!;

    expect(expanded.blocks.map((candidate) => [candidate.x, candidate.y])).toEqual([
      [0, 0],
      [900, 0],
      [300, 100],
      [600, 120],
    ]);
    const [innerA, innerB] = expanded.blocks.slice(2).map((candidate) => candidate.id);
    expect([innerA, innerB]).not.toContain('a');
    expect(expanded.connections.map(({ fromId, toId }) => [fromId, toId])).toEqual([
      [innerA, innerB],
      ['start', innerA],
      [innerB, 'end'],
    ]);
  });
});
