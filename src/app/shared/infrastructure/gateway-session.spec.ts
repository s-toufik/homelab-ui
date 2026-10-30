import { TestBed } from '@angular/core/testing';
import { GatewaySession } from './gateway-session';
import { API_ROUTING, type ApiRouting } from './homelab-server';

function session(routing: ApiRouting): GatewaySession {
  TestBed.configureTestingModule({ providers: [{ provide: API_ROUTING, useValue: routing }] });
  return TestBed.inject(GatewaySession);
}

describe('GatewaySession', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('does nothing outside the gateway', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    const current = session('direct');

    await current.load();

    expect(fetch).not.toHaveBeenCalled();
    expect(current.user()).toBeNull();
  });

  it('takes the username from the signed-in session', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          user: 'f3c1-uuid',
          email: 'toufik@example.com',
          preferredUsername: 'toufik',
        }),
      ),
    );
    vi.stubGlobal('fetch', fetch);
    const current = session('gateway');

    await current.load();

    expect(fetch.mock.calls[0][0]).toBe('/oauth2/userinfo');
    expect(current.user()).toEqual({ username: 'toufik', email: 'toufik@example.com' });
  });

  it('sends the browser to sign in when the session has ended', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
    const current = session('gateway');
    const signIn = vi.spyOn(current, 'signIn').mockImplementation(() => undefined);

    await current.load();

    expect(signIn).toHaveBeenCalledOnce();
    expect(current.user()).toBeNull();
  });
});
