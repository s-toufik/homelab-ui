import type { AgentMood } from '../../domain/agent-activity';
import { HEIGHT, PixelFrame, WIDTH, color } from './pixel-frame';
import { DRAWN_CASTS, SCENES, castScenes, loadCast, paint, sceneFor } from './pixel-scenes';

const MOODS: readonly AgentMood[] = ['idle', 'working', 'waiting', 'trouble'];

function same(a: PixelFrame, b: PixelFrame): boolean {
  return a.pixels.every((value, index) => value === b.pixels[index]);
}

const AGENTS = Object.keys(SCENES);

describe('pixel scenes', () => {
  beforeAll(async () => {
    await Promise.all(DRAWN_CASTS.map((cast) => loadCast(cast)));
  });

  for (const cast of DRAWN_CASTS) {
    for (const agent of AGENTS) {
      it(`paints every pixel of ${cast}'s ${agent} in every mood`, () => {
        for (const mood of MOODS)
          for (const frame of [0, 7, 31])
            expect(paint(agent, mood, frame, cast).pixels.every((value) => value !== 0)).toBe(true);
      });

      it(`moves ${cast}'s ${agent} while working and shows each mood differently`, () => {
        const frames = [0, 3, 5, 9, 14].map((frame) => paint(agent, 'working', frame, cast));
        expect(frames.some((frame) => !same(frame, frames[0]))).toBe(true);
        const moods = MOODS.map((mood) => paint(agent, mood, 1, cast));
        for (let i = 0; i < moods.length; i++)
          for (let j = i + 1; j < moods.length; j++) expect(same(moods[i], moods[j])).toBe(false);
      });
    }
  }

  it('gives every cast all seven agents', () => {
    for (const cast of DRAWN_CASTS)
      expect(Object.keys(castScenes(cast) ?? {}).sort()).toEqual([...AGENTS].sort());
  });

  it('gives unknown agents the cast’s Assistant', () => {
    expect(sceneFor('supervisor')).toBe(SCENES['assistant']);
    expect(sceneFor('supervisor', 'pocket')).toBe(castScenes('pocket')?.['assistant']);
  });
});

describe('pixel frame', () => {
  it('outlines a sprite with its outline colour', () => {
    const frame = new PixelFrame();
    const ink = color('#000000');
    const fill = color('#ff0000');
    frame.sprite(() => frame.rect(10, 10, 2, 2, fill), ink);

    expect(frame.get(10, 10)).toBe(fill);
    expect(frame.get(9, 10)).toBe(ink);
    expect(frame.get(12, 11)).toBe(ink);
    expect(frame.get(9, 9)).toBe(0);
  });

  it('clips drawing to the frame', () => {
    const frame = new PixelFrame();
    frame.rect(-5, -5, WIDTH + 10, HEIGHT + 10, color('#123456'));
    expect(frame.pixels.every((value) => value === color('#123456'))).toBe(true);
  });
});
