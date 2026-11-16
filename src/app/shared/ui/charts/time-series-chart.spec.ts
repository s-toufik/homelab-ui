import { zoomRange } from './time-series-chart';

describe('chart zoom', () => {
  it('zooms around the pointer, keeping the point under it in place', () => {
    expect(zoomRange(0, 100, 25, 0.5)).toEqual([12.5, 62.5]);
    expect(zoomRange(0, 100, 50, 2)).toEqual([-50, 150]);
  });
});
