import { TestBed } from '@angular/core/testing';
import { HOMELAB_SERVER_URL } from '@shared/infrastructure/homelab-server';
import { AgentModelsService } from './agent-models.service';

describe('AgentModelsService', () => {
  afterEach(() => vi.unstubAllGlobals());

  function service(): AgentModelsService {
    TestBed.configureTestingModule({
      providers: [{ provide: HOMELAB_SERVER_URL, useValue: 'http://server' }],
    });
    return TestBed.inject(AgentModelsService);
  }

  it('maps the listing from the agent', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          models: [
            { name: 'qwen3-8b', context_tokens: 16384, max_output_tokens: 4096, thinking: false },
          ],
          pinned_steps: { act: 'big-model' },
        }),
      ),
    );
    vi.stubGlobal('fetch', fetch);

    const listing = await service().list();

    expect(fetch.mock.calls[0][0]).toBe('http://server:8000/v1/models');
    expect(listing).toEqual({
      models: [{ name: 'qwen3-8b', contextTokens: 16384, maxOutputTokens: 4096, thinking: false }],
      pinnedSteps: { act: 'big-model' },
    });
  });

  it('fails when the agent does not answer 2xx', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 503 })));

    await expect(service().list()).rejects.toThrow('503');
  });
});
