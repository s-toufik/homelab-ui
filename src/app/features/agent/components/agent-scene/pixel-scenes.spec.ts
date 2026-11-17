import type { AgentMood } from '../../domain/agent-activity';
import { HEIGHT, PixelFrame, WIDTH, color } from './pixel-frame';
import { SCENES, paint, sceneFor } from './pixel-scenes';

const MOODS: readonly AgentMood[] = ['idle', 'working', 'waiting', 'trouble'];

function same(a: PixelFrame, b: PixelFrame): boolean {
  return a.pixels.every((value, index) => value === b.pixels[index]);
}

describe('pixel scenes', () => {
  for (const agent of Object.keys(SCENES)) {
    it(`paints every pixel of ${agent}'s scene in every mood`, () => {
      for (const mood of MOODS)
        for (const frame of [0, 7, 31])
          expect(paint(agent, mood, frame).pixels.every((value) => value !== 0)).toBe(true);
    });

    it(`moves ${agent} while working and shows each mood differently`, () => {
      const frames = [0, 3, 5, 9, 14].map((frame) => paint(agent, 'working', frame));
      expect(frames.some((frame) => !same(frame, frames[0]))).toBe(true);
      const moods = MOODS.map((mood) => paint(agent, mood, 1));
      for (let i = 0; i < moods.length; i++)
        for (let j = i + 1; j < moods.length; j++) expect(same(moods[i], moods[j])).toBe(false);
    });
  }

  it('gives unknown agents the Maestro', () => {
    expect(sceneFor('supervisor')).toBe(SCENES['assistant']);
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
