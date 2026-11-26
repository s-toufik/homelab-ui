import { TestBed } from '@angular/core/testing';
import { GatewaySession, PREVIEW_GROUPS } from './gateway-session';
import { API_ROUTING, type ApiRouting } from './homelab-server';

function session(routing: ApiRouting): GatewaySession {
  TestBed.configureTestingModule({ providers: [{ provide: API_ROUTING, useValue: routing }] });
  return TestBed.inject(GatewaySession);
}

function stubAssign() {
  const assign = vi.fn();
  vi.stubGlobal('location', { ...location, assign });
  return assign;
}

describe('GatewaySession', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

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

  it('is admin only with the realm role admin', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ preferredUsername: 'toufik', groups: ['role:admin'] })),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ preferredUsername: 'guest', groups: ['role:user'] })),
      );
    vi.stubGlobal('fetch', fetch);
    const current = session('gateway');

    await current.load();
    const admin = current.isAdmin();
    await current.load();

    expect([admin, current.isAdmin()]).toEqual([true, false]);
  });

  it('sends the browser to sign in when the page opens without a session', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
    const assign = stubAssign();
    const current = session('gateway');

    await current.load();

    expect(assign).toHaveBeenCalledWith(expect.stringContaining('/oauth2/sign_in?rd='));
    expect(current.user()).toBeNull();
  });

  it('asks before signing in again when the session ends while the page is open', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
    const assign = stubAssign();
    const current = session('gateway');

    await current.verify();

    expect(current.expired()).toBe(true);
    expect(assign).not.toHaveBeenCalled();
  });

  it('closes the prompt once the session is back, e.g. after signing in from another tab', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response('', { status: 401 }))
        .mockResolvedValueOnce(new Response(JSON.stringify({ preferredUsername: 'toufik' }))),
    );
    const current = session('gateway');

    await current.verify();
    await current.verify();

    expect(current.expired()).toBe(false);
  });

  it('keeps the session when the gateway cannot be reached', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('offline')));
    const current = session('gateway');

    await current.verify();

    expect(current.expired()).toBe(false);
  });

  it('does not bounce back and forth once a redirect already failed to fix it', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
    const assign = stubAssign();
    const current = session('gateway');

    await current.load();
    await current.load();

    expect(assign).toHaveBeenCalledOnce();
    expect(current.expired()).toBe(true);
  });

  it('does not let an unrelated successful load clear the retry guard', async () => {
    const assign = stubAssign();
    const current = session('gateway');
    current.signIn();
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(new Response(JSON.stringify({})))
        .mockResolvedValueOnce(new Response('', { status: 401 })),
    );

    await current.load();
    await current.load();

    expect(assign).toHaveBeenCalledOnce();
  });

  it('outside the gateway, previews a non-admin with the groups saved for it', () => {
    TestBed.configureTestingModule({
      providers: [
        { provide: API_ROUTING, useValue: 'direct' },
        { provide: PREVIEW_GROUPS, useValue: ['role:agent:kitchen'] },
      ],
    });
    const current = TestBed.inject(GatewaySession);
    expect([current.isAdmin(), current.groups()]).toEqual([false, ['role:agent:kitchen']]);
  });
});
