import { TestBed } from '@angular/core/testing';
import { AgentHealthService } from './agent-health.service';

describe('AgentHealthService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('is ready only when the readiness check answers 2xx', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(new Response('{"status":"UP"}', { status: 200 }))
      .mockResolvedValueOnce(new Response('{"status":"DOWN"}', { status: 503 }))
      .mockRejectedValueOnce(new TypeError('network'));
    vi.stubGlobal('fetch', fetch);
    const health = TestBed.inject(AgentHealthService);

    expect([await health.isReady(), await health.isReady(), await health.isReady()]).toEqual([
      true,
      false,
      false,
    ]);
    expect(fetch.mock.calls[0][0]).toBe('http://sirius:8000/actuator/health/readiness');
  });
});
