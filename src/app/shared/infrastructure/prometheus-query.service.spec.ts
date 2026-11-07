import { TestBed } from '@angular/core/testing';
import { HOMELAB_SERVER_URL } from '@shared/infrastructure/homelab-server';
import { PrometheusQueryService, seriesName } from './prometheus-query.service';

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

describe('PrometheusQueryService ranges and vectors', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('turns a matrix into series with millisecond times', async () => {
    const fetch = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          status: 'success',
          data: {
            resultType: 'matrix',
            result: [
              {
                metric: { job: 'node' },
                values: [
                  [10, '1.5'],
                  [25, '2'],
                ],
              },
            ],
          },
        }),
      ),
    );
    vi.stubGlobal('fetch', fetch);
    TestBed.configureTestingModule({
      providers: [{ provide: HOMELAB_SERVER_URL, useValue: 'http://server' }],
    });

    const series = await TestBed.inject(PrometheusQueryService).range('up', 0, 30, 15);

    expect(series).toEqual([
      {
        labels: { job: 'node' },
        points: [
          [10_000, 1.5],
          [25_000, 2],
        ],
      },
    ]);
    expect(fetch.mock.calls[0][0]).toContain('/api/v1/query_range?query=up&start=0&end=30&step=15');
  });

  it('names a series from a legend template or its labels', () => {
    expect(seriesName({ __name__: 'up', job: 'node' })).toBe('up{job="node"}');
    expect(seriesName({ pod: 'caddy-1' }, '{{pod}} CPU')).toBe('caddy-1 CPU');
  });
});
