import { TestBed } from '@angular/core/testing';
import { GatewayApi, GatewayApiError } from './gateway-api';
import { GatewaySession } from './gateway-session';
import { API_ROUTING } from './homelab-server';

function api(): GatewayApi {
  TestBed.configureTestingModule({ providers: [{ provide: API_ROUTING, useValue: 'gateway' }] });
  return TestBed.inject(GatewayApi);
}

describe('GatewayApi', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('marks every request as its own and sends JSON bodies', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response('{"ok":true}'));
    vi.stubGlobal('fetch', fetch);

    const answer = await api().json<{ ok: boolean }>('/api/kafka/x', {
      method: 'POST',
      body: { name: 'demo' },
    });

    const init = fetch.mock.calls[0][1] as RequestInit;
    expect(answer).toEqual({ ok: true });
    expect(init.method).toBe('POST');
    expect((init.headers as Record<string, string>)['X-Homelab-Request']).toBe('1');
    expect(init.body).toBe('{"name":"demo"}');
  });

  it('signs in again on 401 and reports other failures with their message', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response('', { status: 401 }))
        .mockResolvedValueOnce(new Response('{"message":"topic exists"}', { status: 409 })),
    );
    const client = api();
    const signIn = vi
      .spyOn(TestBed.inject(GatewaySession), 'signIn')
      .mockImplementation(() => true);

    const error = await client.json('/api/a').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GatewayApiError);
    expect((error as Error).message).toContain('Signing in again');
    await expect(client.json('/api/b')).rejects.toThrow('409: topic exists');
    expect(signIn).toHaveBeenCalledOnce();
  });

  it('reports an access problem instead of looping when sign-in was just tried', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
    const client = api();
    vi.spyOn(TestBed.inject(GatewaySession), 'signIn').mockImplementation(() => false);

    await expect(client.json('/api/a')).rejects.toThrow(/reloading the page/);
  });
});
