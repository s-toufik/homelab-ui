import { timeWindow } from './time-range';

describe('timeWindow', () => {
  it('ends now and keeps about 240 points, never under 15 s', () => {
    expect(timeWindow('1h', 3_600_000)).toEqual({ startSec: 0, endSec: 3600, stepSec: 15 });
    expect(timeWindow('7d', 604_800_000)).toEqual({ startSec: 0, endSec: 604_800, stepSec: 2520 });
  });
});
