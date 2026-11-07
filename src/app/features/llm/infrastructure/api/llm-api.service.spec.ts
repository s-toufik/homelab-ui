import { toModels } from './llm-api.service';

describe('llama-swap API mapping', () => {
  it('marks loaded models and lists them first', () => {
    const models = toModels(
      { data: [{ id: 'qwen3-14b' }, { id: 'gemma' }, { id: 'tiny', name: 'Tiny' }] },
      {
        running: [
          { model: 'tiny', state: 'ready' },
          { model: 'gemma', state: 'starting' },
        ],
      },
    );
    expect(models.map((m) => [m.id, m.state])).toEqual([
      ['gemma', 'starting'],
      ['tiny', 'ready'],
      ['qwen3-14b', 'stopped'],
    ]);
  });
});
