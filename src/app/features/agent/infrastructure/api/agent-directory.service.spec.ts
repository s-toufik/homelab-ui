import { TestBed } from '@angular/core/testing';
import { API_ROUTING, HOMELAB_SERVER_URL } from '@shared/infrastructure/homelab-server';
import { agentAddress } from './agent-address';
import { AgentDirectoryService } from './agent-directory.service';

describe('AgentDirectoryService', () => {
  afterEach(() => vi.unstubAllGlobals());

  function service(): AgentDirectoryService {
    TestBed.configureTestingModule({
      providers: [{ provide: HOMELAB_SERVER_URL, useValue: 'http://server' }],
    });
    return TestBed.inject(AgentDirectoryService);
  }

  it('asks the supervisor which agents answer', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          agents: [
            {
              name: 'observation',
              description: 'the observation agent',
              skills: [{ id: 'answer', name: 'Answer', description: 'Explains.', tags: ['x'] }],
            },
          ],
        }),
      ),
    );
    vi.stubGlobal('fetch', fetch);

    const agents = await service().list();

    expect(fetch.mock.calls[0][0]).toBe('http://server:8000/v1/agents');
    expect(agents).toEqual([
      {
        name: 'observation',
        description: 'the observation agent',
        skills: [{ id: 'answer', name: 'Answer', description: 'Explains.' }],
      },
    ]);
  });

  it('fails when the supervisor does not answer 2xx', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 502 })));

    await expect(service().list()).rejects.toThrow('502');
  });
});

describe('agentAddress', () => {
  it('reaches the supervisor at the agent route and the others at their own', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: HOMELAB_SERVER_URL, useValue: 'https://homelab' },
        { provide: API_ROUTING, useValue: 'gateway' },
      ],
    });

    expect(agentAddress('supervisor').api).toBe('/api/agent');
    expect(agentAddress('observation').api).toBe('/api/agents/observation');
  });
});
