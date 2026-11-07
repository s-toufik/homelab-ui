import { defaultConfig } from '../domain/workflow';
import type { BlockExecutor } from './block-executor';
import { WorkflowDocumentStore } from './workflow-document.store';

function store(): WorkflowDocumentStore {
  let next = 0;
  const executor = {
    execute: (config: { kind: string }) => Promise.resolve(`${config.kind} ran`),
  } as unknown as BlockExecutor;
  return new WorkflowDocumentStore(
    { id: 'w', name: 'Test', blocks: [], connections: [], dirty: false, persisted: true },
    executor,
    () => `id-${next++}`,
  );
}

describe('WorkflowDocumentStore', () => {
  it('names a block, and a favorite added to the canvas keeps its name', () => {
    const document = store();
    const http = document.addBlock('http');
    const favorite = document.addBlockWithConfig(defaultConfig('code'), 'Parse pods');

    document.renameBlock(http, '  Fetch pods ');

    const byId = new Map(document.blocks().map((block) => [block.id, block]));
    expect(byId.get(http)?.label).toBe('Fetch pods');
    expect(byId.get(favorite)?.label).toBe('Parse pods');
    expect(document.dirty()).toBe(true);
  });

  it('clears the name when it is emptied, and keeps a group name in step', () => {
    const document = store();
    const group = document.addBlockWithConfig({
      ...defaultConfig('group'),
      name: 'Group',
    } as never);

    document.renameBlock(group, 'Nightly report');
    expect(document.blocks()[0].config).toMatchObject({ name: 'Nightly report' });

    document.renameBlock(group, '');
    expect(document.blocks()[0].label).toBeUndefined();
  });

  it('runs a canvas without a trigger', async () => {
    const document = store();
    const http = document.addBlock('http');

    await document.run();

    expect(document.results()[http]).toEqual({ status: 'success', output: 'http ran' });
  });
});
