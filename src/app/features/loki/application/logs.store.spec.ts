import { volumeByLevel } from './logs.store';

describe('Log volume by level', () => {
  it('merges levels that differ only by case, and orders them by severity', () => {
    const series = volumeByLevel([
      {
        labels: { detected_level: 'info' },
        points: [
          [60, 2],
          [120, 3],
        ],
      },
      { labels: { detected_level: 'INFO' }, points: [[60, 5]] },
      { labels: { detected_level: 'ERROR' }, points: [[120, 1]] },
      { labels: {}, points: [[60, 4]] },
    ]);

    expect(series.map((s) => s.name)).toEqual(['error', 'info', 'unknown']);
    expect(series.find((s) => s.name === 'info')?.points).toEqual([
      [60, 7],
      [120, 3],
    ]);
    expect(series[0].color).toBe('var(--danger)');
  });
});
