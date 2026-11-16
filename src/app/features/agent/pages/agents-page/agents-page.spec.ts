import { gutterPath, linkPath, mapLayout } from './agents-page';

describe('agents map', () => {
  it('puts the Assistant in the middle and its helpers around it', () => {
    const { hub, spots } = mapLayout(6, false);
    expect(hub).toEqual({ x: 50, y: 50 });
    expect(spots[0].x).toBeCloseTo(50);
    expect(spots[0].y).toBeCloseTo(16);
    expect(spots.every((spot) => spot.x >= 10 && spot.x <= 90)).toBe(true);
  });

  it('stacks the helpers in two columns under the Assistant on a phone', () => {
    const { hub, spots } = mapLayout(6, true);
    expect(hub.y).toBe(12);
    expect(spots.map((spot) => [spot.x, spot.y])).toEqual([
      [26, 38],
      [74, 38],
      [26, 62],
      [74, 62],
      [26, 86],
      [74, 86],
    ]);
  });

  it('bends each link a little', () => {
    expect(linkPath({ x: 50, y: 50 }, { x: 50, y: 10 })).toBe('M50 50Q54.8 30 50 10');
  });

  it('runs phone links down the gutter between the columns', () => {
    expect(gutterPath({ x: 50, y: 12 }, { x: 26, y: 62 })).toBe('M50 12L50 62L48 62');
    expect(gutterPath({ x: 50, y: 12 }, { x: 74, y: 38 })).toBe('M50 12L50 38L52 38');
  });
});
