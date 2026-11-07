import { formatValue, niceTicks } from './chart-format';

describe('chart formatting', () => {
  it('formats values by unit', () => {
    expect(formatValue(1536, 'bytes')).toBe('1.5 KiB');
    expect(formatValue(0.25, 'ratio')).toBe('25%');
    expect(formatValue(0.0042, 'seconds')).toBe('4.2 ms');
    expect(formatValue(12_400, 'number')).toBe('12.4k');
    expect(formatValue(null)).toBe('–');
  });

  it('picks round tick values', () => {
    expect(niceTicks(0, 100)).toEqual([0, 25, 50, 75, 100]);
    expect(niceTicks(0, 7)).toEqual([0, 2, 4, 6]);
  });
});
