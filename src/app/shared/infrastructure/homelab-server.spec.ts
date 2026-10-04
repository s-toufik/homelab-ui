import { TestBed } from '@angular/core/testing';
import { HOMELAB_SERVER_URL, HomelabServer } from './homelab-server';

function server(): HomelabServer {
  TestBed.configureTestingModule({
    providers: [{ provide: HOMELAB_SERVER_URL, useValue: 'http://sirius/' }],
  });
  return TestBed.inject(HomelabServer);
}

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
