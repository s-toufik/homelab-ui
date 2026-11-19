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

  it('sends the browser to sign in when the session has ended', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 401 })));
    const current = session('gateway');
    const signIn = vi.spyOn(current, 'signIn').mockImplementation(() => true);

    await current.load();

    expect(signIn).toHaveBeenCalledOnce();
    expect(current.user()).toBeNull();
  });

  it('redirects to sign-in', () => {
    const assign = stubAssign();
    const current = session('gateway');

    const redirected = current.signIn();

    expect(redirected).toBe(true);
    expect(assign).toHaveBeenCalledWith(expect.stringContaining('/oauth2/sign_in?rd='));
  });

  it('does not bounce back and forth once a redirect already failed to fix it', () => {
    const assign = stubAssign();
    const current = session('gateway');

    current.signIn();
    const redirectedAgain = current.signIn();

    expect(redirectedAgain).toBe(false);
    expect(assign).toHaveBeenCalledOnce();
  });

  it('allows signing in again once a load succeeds', async () => {
    const assign = stubAssign();
    const current = session('gateway');
    current.signIn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({}))));

    await current.load();
    const redirected = current.signIn();

    expect(redirected).toBe(true);
    expect(assign).toHaveBeenCalledTimes(2);
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
