import { detectLevel } from '../domain/log-line';
import { toResult } from './loki-query.service';

describe('Loki query mapping', () => {
  it('flattens streams into lines, newest first, with a level', () => {
    const result = toResult({
      data: {
        resultType: 'streams',
        result: [
          {
            stream: { service_name: 'caddy', level: 'error' },
            values: [['1762500000000000000', 'boom']],
          },
          {
            stream: { service_name: 'llm' },
            values: [['1762500001000000000', 'INFO model loaded']],
          },
        ],
      },
    });

    expect(result.kind).toBe('lines');
    if (result.kind !== 'lines') return;
    expect(result.lines.map((l) => [l.timeMs, l.level, l.line])).toEqual([
      [1762500001000, 'info', 'INFO model loaded'],
      [1762500000000, 'error', 'boom'],
    ]);
  });

  it('reads metric queries as series', () => {
    const result = toResult({
      data: { resultType: 'matrix', result: [{ metric: { level: 'warn' }, values: [[10, '3']] }] },
    });
    expect(result).toEqual({
      kind: 'series',
      series: [{ labels: { level: 'warn' }, points: [[10_000, 3]] }],
    });
  });

  it('finds the level in JSON and logfmt lines', () => {
    expect(detectLevel({}, '{"level":"warning","msg":"slow"}')).toBe('warn');
    expect(detectLevel({}, 'ts=1 level=debug msg=x')).toBe('debug');
    expect(detectLevel({}, 'plain text')).toBe('unknown');
  });
});
