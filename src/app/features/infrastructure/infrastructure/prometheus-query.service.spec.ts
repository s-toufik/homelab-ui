import { TestBed } from '@angular/core/testing';
import { HOMELAB_SERVER_URL } from '@shared/infrastructure/homelab-server';
import { PrometheusQueryService } from './prometheus-query.service';

function answer(result: unknown[]) {
  return new Response(JSON.stringify({ status: 'success', data: { result } }));
}

describe('PrometheusQueryService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('reads the first sample, or null when the series does not exist', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(answer([{ value: [1, '1'] }]))
      .mockResolvedValueOnce(answer([]));
    vi.stubGlobal('fetch', fetch);
    TestBed.configureTestingModule({
      providers: [{ provide: HOMELAB_SERVER_URL, useValue: 'http://server' }],
    });
    const prometheus = TestBed.inject(PrometheusQueryService);

    expect([await prometheus.value('pg_up'), await prometheus.value('mongodb_up')]).toEqual([
      1,
      null,
    ]);
    expect(fetch.mock.calls[0][0]).toBe('http://server:9090/api/v1/query?query=pg_up');
  });
});
