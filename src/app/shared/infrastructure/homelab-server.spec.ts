import { TestBed } from '@angular/core/testing';
import { API_ROUTING, HOMELAB_SERVER_URL, HomelabServer, type ApiRouting } from './homelab-server';

function server(routing: ApiRouting = 'direct'): HomelabServer {
  TestBed.configureTestingModule({
    providers: [
      { provide: HOMELAB_SERVER_URL, useValue: 'http://sirius/' },
      { provide: API_ROUTING, useValue: routing },
    ],
  });
  return TestBed.inject(HomelabServer);
}

describe('HomelabServer behind the gateway', () => {
  afterEach(() => vi.unstubAllGlobals());

  const agent = { key: 'agent', port: 8000, subpath: null, api: '/api/agent' };

  it('calls APIs through their gateway path on the same origin', () => {
    expect(server('gateway').api(agent, '/v1/models')).toBe('/api/agent/v1/models');
  });

  it('keeps direct addresses for links and for services without a gateway path', () => {
    const homelab = server('gateway');

    expect(homelab.url(agent)).toBe('http://sirius:8000');
    expect(homelab.api({ port: 3000, subpath: null }, '/x')).toBe('http://sirius:3000/x');
  });

  it('links the tools on the gateway host, keeping each tool on its own port', () => {
    TestBed.configureTestingModule({ providers: [{ provide: API_ROUTING, useValue: 'gateway' }] });
    const homelab = TestBed.inject(HomelabServer);

    expect(homelab.url({ port: 3000, subpath: null })).toBe(
      `${location.protocol}//${location.hostname}:3000`,
    );
    expect(homelab.host).toBe(location.hostname);
  });

  it('reads health through the gateway and trusts the real status code', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 200 }))
      .mockResolvedValueOnce(new Response(null, { status: 502 }));
    vi.stubGlobal('fetch', fetch);
    const homelab = server('gateway');
    const grafana = { key: 'grafana', port: 3000, subpath: null, healthPath: '/api/health' };

    expect([await homelab.isReachable(grafana), await homelab.isReachable(grafana)]).toEqual([
      true,
      false,
    ]);
    expect(fetch.mock.calls[0][0]).toBe('/api/health/grafana');
  });
});

describe('HomelabServer', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('uses the port when there is one, with the subpath after it', () => {
    const homelab = server();

    expect(homelab.url({ port: 3000, subpath: null })).toBe('http://sirius:3000');
    expect(homelab.url({ port: 8090, subpath: 'ui' })).toBe('http://sirius:8090/ui');
    expect(homelab.url({ port: 8000, subpath: null }, '/v1/stream')).toBe(
      'http://sirius:8000/v1/stream',
    );
  });

  it('uses the subpath on the server itself when there is no port', () => {
    const homelab = server();

    expect(homelab.url({ port: null, subpath: '/grafana/' })).toBe('http://sirius/grafana');
    expect(homelab.url({ port: null, subpath: null })).toBe('http://sirius');
    expect(homelab.host).toBe('sirius');
  });

  it('counts any reply from the health path as reachable and a network error as not', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response(null))
      .mockRejectedValueOnce(new TypeError());
    vi.stubGlobal('fetch', fetch);
    const homelab = server();
    const grafana = { port: 3000, subpath: null, healthPath: '/api/health' };

    expect([await homelab.isReachable(grafana), await homelab.isReachable(grafana)]).toEqual([
      true,
      false,
    ]);
    expect(fetch.mock.calls[0][0]).toBe('http://sirius:3000/api/health');
    expect(fetch.mock.calls[0][1]).toMatchObject({ mode: 'no-cors' });
  });
});
