import { waterfall } from '../../domain/trace';
import { toSpans, toSummaries } from './tempo-api.service';

describe('Tempo API mapping', () => {
  it('reads search results newest first', () => {
    const traces = toSummaries({
      traces: [
        {
          traceID: 'a',
          rootServiceName: 'agent',
          rootTraceName: 'POST /v1/stream',
          startTimeUnixNano: '1000000000',
          durationMs: 120,
        },
        {
          traceID: 'b',
          rootServiceName: 'toolbox',
          startTimeUnixNano: '2000000000',
          durationMs: 5,
        },
      ],
    });
    expect(traces.map((t) => [t.traceId, t.startMs, t.durationMs])).toEqual([
      ['b', 2000, 5],
      ['a', 1000, 120],
    ]);
  });

  it('builds a waterfall from the spans, children under their parent', () => {
    const spans = toSpans({
      batches: [
        {
          resource: { attributes: [{ key: 'service.name', value: { stringValue: 'agent' } }] },
          scopeSpans: [
            {
              spans: [
                {
                  spanId: 'c',
                  parentSpanId: 'r',
                  name: 'tool',
                  startTimeUnixNano: '1050000000',
                  endTimeUnixNano: '1100000000',
                },
                {
                  spanId: 'r',
                  name: 'request',
                  startTimeUnixNano: '1000000000',
                  endTimeUnixNano: '1200000000',
                  status: { code: 2, message: 'failed' },
                },
              ],
            },
          ],
        },
      ],
    });
    const { rows, durationMs } = waterfall(spans);

    expect(durationMs).toBe(200);
    expect(rows.map((r) => [r.span.name, r.depth, r.offsetPercent])).toEqual([
      ['request', 0, 0],
      ['tool', 1, 25],
    ]);
    expect(rows[0].span.error).toBe(true);
  });
});
