import { TestBed } from '@angular/core/testing';
import {
  API_ROUTING,
  HOMELAB_SERVER_URL,
  type ApiRouting,
} from '@shared/infrastructure/homelab-server';
import { PostgrestWorkflowRepository } from './postgrest-workflow.repository';

describe('PostgrestWorkflowRepository', () => {
  afterEach(() => vi.unstubAllGlobals());

  function repository(routing: ApiRouting = 'direct'): PostgrestWorkflowRepository {
    TestBed.configureTestingModule({
      providers: [
        { provide: HOMELAB_SERVER_URL, useValue: 'http://server' },
        { provide: API_ROUTING, useValue: routing },
      ],
    });
    return TestBed.inject(PostgrestWorkflowRepository);
  }

  it('goes through the gateway path in production', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('[]'));
    vi.stubGlobal('fetch', fetch);

    await repository('gateway').list();

    expect(fetch.mock.calls[0][0]).toBe(
      '/api/tasker/workflows?select=id,name,updated_at&order=updated_at.desc',
    );
  });

  it('asks to sign in again when the gateway answers 401', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(new Response('Sign in required', { status: 401 })),
    );

    await expect(repository('gateway').list()).rejects.toThrow('Reload the page to sign in again');
  });

  it('never sends an empty name', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify([{ id: 'w1', name: 'Untitled workflow', updated_at: 'now' }])),
      );
    vi.stubGlobal('fetch', fetch);

    await repository().save({ id: 'w1', name: '   ', blocks: [], connections: [] });

    expect(JSON.parse(fetch.mock.calls[0][1].body).name).toBe('Untitled workflow');
  });

  it('lists workflows newest first', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify([{ id: 'w1', name: 'Alerts', updated_at: '2026-10-29' }])),
      );
    vi.stubGlobal('fetch', fetch);

    const workflows = await repository().list();

    expect(fetch.mock.calls[0][0]).toBe(
      'http://server:3001/workflows?select=id,name,updated_at&order=updated_at.desc',
    );
    expect(workflows).toEqual([{ id: 'w1', name: 'Alerts', updatedAt: '2026-10-29' }]);
  });

  it('upserts on save', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(
        new Response(JSON.stringify([{ id: 'w1', name: 'Alerts', updated_at: 'now' }])),
      );
    vi.stubGlobal('fetch', fetch);

    await repository().save({ id: 'w1', name: 'Alerts', blocks: [], connections: [] });

    const [url, init] = fetch.mock.calls[0];
    expect(url).toBe('http://server:3001/workflows');
    expect(init.method).toBe('POST');
    expect(init.headers.Prefer).toBe('resolution=merge-duplicates,return=representation');
    expect(JSON.parse(init.body)).toMatchObject({ id: 'w1', name: 'Alerts', blocks: [] });
  });

  it('drops blocks of unknown kinds when loading', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify([
            {
              id: 'w1',
              name: 'Old',
              updated_at: 'now',
              blocks: [
                { id: 'a', x: 0, y: 0, config: { kind: 'agent', message: 'hi' } },
                { id: 'b', x: 0, y: 0, config: { kind: 'output' } },
              ],
              connections: [{ id: 'c', fromId: 'a', toId: 'b' }],
            },
          ]),
        ),
      ),
    );

    const workflow = await repository().get('w1');

    expect(workflow.blocks.map((block) => block.id)).toEqual(['b']);
    expect(workflow.connections).toEqual([]);
  });

  it('explains when the database cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')));

    await expect(repository().list()).rejects.toThrow(
      "Can't reach the Tasker database at http://server:3001",
    );
  });
});
