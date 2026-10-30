import { executeGraph, groupOutput, groupSeeds, rootSeeds } from './graph-execution';
import type { GroupConfig, WorkflowBlock, WorkflowGraph } from './workflow';

function code(id: string, script: string): WorkflowBlock {
  return { id, x: 0, y: 0, config: { kind: 'code', script } };
}

const run = (block: WorkflowBlock, input: unknown) => {
  if (block.config.kind !== 'code') return Promise.resolve(null);
  return Promise.resolve(new Function('input', block.config.script)(input));
};

describe('graph execution', () => {
  it('passes each output downstream in order', async () => {
    const graph: WorkflowGraph = {
      blocks: [
        { id: 't', x: 0, y: 0, config: { kind: 'trigger' } },
        code('double', 'return 21 * 2;'),
        code('label', 'return `answer ${input}`;'),
      ],
      connections: [
        { id: 'c1', fromId: 't', toId: 'double' },
        { id: 'c2', fromId: 'double', toId: 'label' },
      ],
    };
    const started: string[] = [];

    const { outputs } = await executeGraph(graph, rootSeeds(graph), {
      execute: run,
      onStart: (id) => started.push(id),
    });

    expect(started).toEqual(['t', 'double', 'label']);
    expect(outputs.get('label')).toBe('answer 42');
  });

  it('stops a branch when a block fails', async () => {
    const graph: WorkflowGraph = {
      blocks: [code('boom', 'throw new Error("nope");'), code('after', 'return 1;')],
      connections: [{ id: 'c1', fromId: 'boom', toId: 'after' }],
    };

    const { outputs, errors } = await executeGraph(graph, new Map([['boom', null]]), {
      execute: run,
    });

    expect(errors.get('boom')?.message).toBe('nope');
    expect(outputs.has('after')).toBe(false);
  });

  it('feeds a group input to its entry blocks and returns its exit output', async () => {
    const config: GroupConfig = {
      kind: 'group',
      name: 'Pair',
      blocks: [code('inc', 'return input + 1;'), code('square', 'return input * input;')],
      connections: [{ id: 'c1', fromId: 'inc', toId: 'square' }],
      inputIds: ['inc'],
      outputIds: ['square'],
    };

    const { outputs } = await executeGraph(config, groupSeeds(config, 4), { execute: run });

    expect(groupOutput(config, outputs)).toBe(25);
  });
});
