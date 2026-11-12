import { normalizeLevel, traceIdOf } from './log-line';

describe('Log line helpers', () => {
  it('reads a level whatever its case', () => {
    expect(['INFO', 'info', 'Information'].map(normalizeLevel)).toEqual(['info', 'info', 'info']);
    expect(['WARN', 'warning'].map(normalizeLevel)).toEqual(['warn', 'warn']);
    expect(['ERROR', 'critical', 'fatal'].map(normalizeLevel)).toEqual(['error', 'error', 'error']);
    expect(normalizeLevel('')).toBe('unknown');
  });

  it('finds the trace id a line carries', () => {
    expect(traceIdOf({ trace_id: '4bf92f3577b34da6a3ce929d0e0e4736' })).toBe(
      '4bf92f3577b34da6a3ce929d0e0e4736',
    );
    expect(traceIdOf({ traceID: '00f067aa0ba902b7' })).toBe('00f067aa0ba902b7');
  });

  it('ignores missing, empty or invalid trace ids', () => {
    expect(traceIdOf({ service_name: 'caddy' })).toBeNull();
    expect(traceIdOf({ trace_id: '00000000000000000000000000000000' })).toBeNull();
    expect(traceIdOf({ trace_id: 'not-a-trace' })).toBeNull();
  });
});
