import {
  MAX_ZOOM,
  facing,
  layout,
  project,
  rotate,
  shortestAngle,
  galaxy,
  starField,
  STAR_TONES,
  toVector,
  zoomAt,
  type View,
} from './sky';

const VIEW: View = { yaw: 0, pitch: 0, zoom: 1, panX: 0, panY: 0 };

function close(a: number, b: number): boolean {
  return Math.abs(a - b) < 1e-9;
}

describe('sky globe', () => {
  it('turns any point of the sphere to face the viewer', () => {
    for (const [lon, lat] of [
      [0, 0],
      [74, 34],
      [218, -60],
      [300, 80],
    ]) {
      const { yaw, pitch } = facing(lon, lat);
      const [x, y, z] = rotate(toVector(lon, lat), yaw, pitch);
      expect(close(x, 0) && close(y, 0) && close(z, 1)).toBe(true);
    }
  });

  it('draws the facing point in the middle of the screen, and hides the back', () => {
    const view = { ...VIEW, ...facing(74, 34) };
    const front = project(toVector(74, 34), view, 800, 600);
    expect([Math.round(front.x), Math.round(front.y)]).toEqual([400, 300]);
    expect(project(toVector(254, -34), view, 800, 600).depth).toBeLessThan(0);
  });

  it('zooms around the pointer and stops at the limits', () => {
    const zoomed = zoomAt(VIEW, 2, 600, 300, 800, 600);
    expect(zoomed.zoom).toBe(2);
    expect(zoomed.panX).toBe(-200);
    expect(zoomAt(VIEW, 100, 400, 300, 800, 600).zoom).toBe(MAX_ZOOM);
  });

  it('takes the short way round', () => {
    expect(shortestAngle(3, -3)).toBeCloseTo(3 + (2 * Math.PI - 6));
  });

  it('places each constellation in its own part of the sky, drawn as a figure', () => {
    const [assistant, observe] = layout([
      {
        id: 'assistant',
        name: 'Assistant',
        hue: 'indigo',
        stars: ['Assistant', 'Agents', 'Kitchen', 'Travel'].map((label) => ({
          id: label,
          label,
          description: '',
          path: '/',
          hue: 'indigo' as const,
        })),
      },
      { id: 'observe', name: 'Observe', hue: 'green', stars: [] },
    ]);
    expect(assistant.stars[0]).toMatchObject({ lon: 0, lat: 16, magnitude: 1 });
    expect(assistant.lines.length).toBe(assistant.stars.length - 1);
    expect([observe.lon, observe.lat]).toEqual([74, 34]);
  });

  it('builds the same star field every time', () => {
    expect(starField(50)).toEqual(starField(50));
    expect(starField(50).every((star) => star.tone >= 0 && star.tone < STAR_TONES.length)).toBe(
      true,
    );
  });

  it('thickens the Milky Way and its glow towards the galactic core', () => {
    const { clouds, dust } = galaxy(2000);
    const bright = clouds.filter((cloud) => cloud.warm);
    expect(clouds).toHaveLength(2000);
    expect(dust.length).toBeGreaterThan(0);
    expect(bright.length).toBeGreaterThan(100);
    expect(bright.length).toBeLessThan(clouds.length / 2);
    expect(galaxy(10)).toEqual(galaxy(10));
  });
});
