import type { AgentMood } from '../../../domain/agent-activity';
import { HEIGHT, PixelFrame, WIDTH, type Color } from '../pixel-frame';
import { X, glow, marks, smoke, sparkle, type PixelScene } from './kit';

function factory(p: PixelFrame, f: number, mood: AgentMood): void {
  p.dither(0, 0, WIDTH, 50, X.iron, X.steelD, (_, j) => 0.2 + (j / 50) * 0.4);
  for (let x = 0; x < WIDTH; x += 16) {
    p.rect(x, 0, 1, 50, X.k);
    for (let y = 4; y < 50; y += 10) p.set(x + 2, y, X.ironL);
  }
  p.rect(0, 8, WIDTH, 3, X.copperD);
  p.rect(0, 8, WIDTH, 1, X.copper);
  for (const x of [22, 58, 86]) p.rect(x, 7, 3, 5, X.copperD);
  if (mood !== 'idle') {
    const puff = f % 12;
    if (puff < 8) p.ellipse(40, 6 - puff / 2, 1.5 + puff / 4, 1.2 + puff / 5, X.g);
  }
  for (let x = 0; x < WIDTH; x += 12) {
    const on = mood === 'trouble' ? f % 4 < 2 : (f + x) % 20 < 14;
    p.set(x + 6, 15, mood === 'trouble' ? (on ? X.r : X.crimsonD) : on ? X.code1 : X.scaleD);
  }
  p.rect(0, 50, WIDTH, 14, X.steelD);
  for (let x = 0; x < WIDTH; x += 6) p.rect(x, 50, 3, 2, X.y);
  for (let x = 3; x < WIDTH; x += 6) p.rect(x, 50, 3, 2, X.k);
  for (let y = 54; y < HEIGHT; y += 4) p.rect(0, y, WIDTH, 1, X.iron);
}

function leds(
  p: PixelFrame,
  f: number,
  mood: AgentMood,
  x: number,
  y: number,
  gap: number,
  size = 2,
): void {
  const color: Color =
    mood === 'trouble' ? (f % 4 < 2 ? X.r : X.rl) : mood === 'idle' ? X.scaleD : X.crystal;
  for (const ex of [x - gap, x + gap - size + 1]) {
    if (mood === 'idle' || (mood !== 'trouble' && f % 32 === 0))
      p.rect(ex, y + size - 1, size, 1, color);
    else p.rect(ex, y, size, size, color);
  }
}

function belt(
  p: PixelFrame,
  f: number,
  x: number,
  y: number,
  w: number,
  moving: boolean,
  dir = 1,
): void {
  p.rect(x, y, w, 3, X.k);
  for (let i = 0; i < w; i += 4)
    p.set(x + ((((i + (moving ? dir * f : 0)) % w) + w) % w), y + 1, X.ironL);
  p.ellipse(x, y + 1.5, 2, 2, X.ironL);
  p.ellipse(x + w, y + 1.5, 2, 2, X.ironL);
}

const dispatch: PixelScene = (p, f, mood) => {
  factory(p, f, mood);
  const on = mood === 'working';
  belt(p, f, 4, 40, 26, on, -1);
  belt(p, f, 66, 40, 26, on, 1);
  if (on)
    for (let k = 0; k < 3; k++) {
      const t = (f + k * 6) % 18;
      p.rect(28 - t, 36, 4, 4, [X.code1, X.amber, X.code2][k]);
      p.rect(66 + t, 36, 4, 4, [X.code3, X.rose, X.teal][k]);
    }
  const x = 48;
  const bob = on ? f % 2 : 0;
  p.sprite(() => {
    p.rect(x - 2, 40, 4, 10, X.iron);
    p.rect(x - 7, 26 + bob, 14, 14, X.steel);
    p.rect(x - 7, 26 + bob, 14, 2, X.steelL);
    p.rect(x - 4, 30 + bob, 8, 6, X.screen);
    for (let i = 0; i < 3; i++)
      p.rect(
        x - 3 + i * 2,
        34 + bob - (on ? (f + i) % 3 : 0),
        1,
        1 + (on ? (f + i) % 3 : 0),
        X.code1,
      );
    p.rect(x - 5, 16 + bob, 10, 8, X.steelL);
    p.rect(x - 1, 24 + bob, 2, 2, X.iron);
    leds(p, f, mood, x, 19 + bob, 3);
    p.line(x, 16 + bob, x, 10 + bob, X.ironL);
    p.ellipse(x, 9 + bob, 3, 1.5, X.steelL);
    const arm = on ? f % 4 < 2 : false;
    const raised = mood === 'trouble' || mood === 'waiting';
    p.line(x - 7, 28 + bob, x - 14, raised || arm ? 20 : 34, X.ironL, 2);
    p.line(x + 6, 28 + bob, x + 13, raised || !arm ? 20 : 34, X.ironL, 2);
    p.rect(x - 17, raised || arm ? 17 : 33, 4, 4, X.r);
    p.rect(x + 13, raised || !arm ? 17 : 33, 4, 4, X.code1);
  }, X.k);
  if (mood === 'trouble') smoke(p, f, x + 6, 14);
  marks(p, f, mood, x + 10, 6, X.w);
};

const kettlebot: PixelScene = (p, f, mood) => {
  factory(p, f, mood);
  const on = mood === 'working';
  const x = 40;
  p.sprite(() => {
    p.rect(x - 6, 46, 4, 4, X.iron);
    p.rect(x + 3, 46, 4, 4, X.iron);
    p.ellipse(x, 36, 11, 11, X.copper);
    p.ellipse(x - 3, 32, 4, 4, X.yl);
    p.rect(x - 6, 39, 12, 5, X.k);
    for (let i = 0; i < 4; i++)
      p.rect(
        x - 5 + i * 3,
        40,
        2,
        3,
        on || mood === 'trouble' ? ((f + i) % 2 ? X.o : X.y) : X.crimsonD,
      );
    p.rect(x - 2, 22, 4, 4, X.copperD);
    p.rect(x - 1, 20, 2, 2, X.steelL);
    p.rect(x - 7, 28, 14, 6, X.copperD);
    leds(p, f, mood, x, 30, 3);
    const whisk = on ? Math.floor(f / 2) % 4 : 0;
    p.line(x + 10, 34, x + 18, 30 + (whisk % 2) * 2, X.ironL, 2);
    p.ellipse(x + 19, 34 + (whisk % 2), 2, 4, X.steelL);
    p.line(x - 10, 34, x - 16, 40, X.ironL, 2);
    p.rect(58, 40, 22, 10, X.steelL);
    p.rect(58, 40, 22, 2, X.steel);
    p.rect(62, 36, 14, 4, X.copper);
  }, X.k);
  if (on || mood === 'trouble')
    for (let s = 0; s < 2; s++)
      for (let k = 0; k < 4; k++) {
        const y = 18 - ((f + s * 5 + k * 3) % 12);
        p.set(
          x + Math.round(Math.sin(y / 2)) + s * 28 + (s ? 0 : 0),
          y + (s ? 16 : 0),
          k % 2 ? X.w : X.g,
        );
      }
  if (mood === 'trouble') smoke(p, f, x, 14);
  marks(p, f, mood, x + 12, 14, X.w);
};

const rover: PixelScene = (p, f, mood) => {
  p.dither(0, 0, WIDTH, 40, X.copperD, X.amber, (_, j) => (j / 40) * 0.8);
  p.ellipse(78, 10, 4, 4, X.yl);
  p.ellipse(18, 7, 2, 2, X.paper);
  const scroll = mood === 'working' ? Math.floor(f / 2) : 0;
  for (let x = 0; x < WIDTH; x++) {
    const h = 6 + Math.round(Math.abs(Math.sin((x + scroll) / 11)) * 7);
    p.rect(x, 40 - h, 1, h, X.copper);
  }
  p.dither(
    0,
    40,
    WIDTH,
    HEIGHT - 40,
    X.sal,
    X.copperD,
    (i, j) => ((i * 3 + j * 5 + scroll * 3) % 13) / 26,
  );
  for (let k = 0; k < 5; k++)
    p.ellipse(((((k * 23 - scroll * 2) % 110) + 110) % 110) - 6, 52 + (k % 3) * 4, 2, 1, X.copperD);
  const x = 44;
  const y = 44;
  p.sprite(() => {
    p.rect(x - 14, y - 10, 28, 8, X.steelL);
    p.rect(x - 14, y - 10, 28, 2, X.w);
    for (let i = 0; i < 4; i++) p.rect(x - 12 + i * 6, y - 12, 4, 2, X.code3);
    p.rect(x + 6, y - 22, 2, 12, X.iron);
    p.rect(x + 3, y - 26, 9, 5, X.steel);
    leds(p, f, mood, x + 8, y - 25, 2, 1);
    for (const wx of [x - 10, x, x + 10]) {
      p.ellipse(wx, y + 1, 4, 4, X.k);
      p.ellipse(wx, y + 1, 1.5, 1.5, X.ironL);
      const spoke = mood === 'working' ? f % 4 : 0;
      p.set(wx + [2, 0, -2, 0][spoke], y + 1 + [0, 2, 0, -2][spoke], X.ironL);
    }
    p.line(x - 12, y - 10, x - 16, y - 20, X.ironL);
    p.rect(x - 18, y - 22, 4, 2, X.gold);
  }, X.k);
  if (mood === 'working')
    for (let k = 0; k < 4; k++) p.set(x - 18 - ((f + k * 2) % 8), y + 2 + (k % 2), X.amber);
  if (mood === 'trouble') smoke(p, f, x - 4, y - 14);
  marks(p, f, mood, x + 14, y - 34, X.w);
};

const sentinel: PixelScene = (p, f, mood) => {
  factory(p, f, mood);
  const on = mood === 'working';
  const x = 48 + (on ? Math.round(Math.sin(f / 5) * 8) : 0);
  const y = 24 + (mood === 'idle' ? 22 : Math.round(Math.sin(f / 3)));
  if (on || mood === 'trouble') {
    const beam = mood === 'trouble' ? X.r : X.yl;
    const sweep = Math.sin(f / 4) * 12;
    for (let j = 0; j < 24; j++) {
      const w = 2 + j / 3;
      for (let i = -w; i <= w; i++)
        p.speckle(Math.round(x + sweep * (j / 24) + i), y + 6 + j, beam, 0.35);
    }
  }
  p.sprite(() => {
    p.ellipse(x, y, 9, 5, X.steelL);
    p.rect(x - 9, y, 18, 2, X.steel);
    p.ellipse(x, y + 2, 4, 3, X.k);
    const lens = mood === 'trouble' ? (f % 4 < 2 ? X.r : X.rl) : mood === 'idle' ? X.scaleD : X.yl;
    p.ellipse(x, y + 2, 2.5, 2, lens);
    for (const side of [-1, 1]) {
      const ax = x + side * 13;
      p.line(x + side * 8, y - 1, ax, y - 4, X.ironL);
      const spin = mood === 'idle' ? 0 : f % 2;
      p.rect(ax - 4 + spin * 2, y - 6, spin ? 4 : 8, 1, X.ironL);
    }
    if (mood === 'idle') {
      p.rect(x - 6, y + 5, 2, 3, X.iron);
      p.rect(x + 4, y + 5, 2, 3, X.iron);
    }
  }, X.k);
  marks(p, f, mood, x + 10, y - 16, X.w);
};

const calcotron: PixelScene = (p, f, mood) => {
  factory(p, f, mood);
  const on = mood === 'working';
  const x = 34;
  p.sprite(() => {
    p.rect(x - 14, 16, 28, 34, X.marble);
    p.rect(x - 14, 16, 28, 2, X.w);
    for (const rx of [x - 7, x + 7]) {
      p.ellipse(rx, 24, 5, 5, X.k);
      p.ellipse(rx, 24, 3.5, 3.5, X.steelL);
      const a = on ? (f / 2) % 4 : 0;
      p.set(rx + [2, 0, -2, 0][a], 24 + [0, 2, 0, -2][a], X.k);
    }
    p.rect(x - 10, 32, 20, 6, X.screen);
    leds(p, f, mood, x, 34, 4);
    for (let i = 0; i < 6; i++)
      p.set(x - 10 + i * 4, 42, (on ? (f + i) % 3 === 0 : i % 2) ? X.r : X.code1);
    p.rect(x - 4, 45, 8, 2, X.k);
  }, X.k);
  const printed = on ? f % 24 : 8;
  p.rect(x + 2 - 3, 47, 6, Math.min(printed, 14) / 2, X.paper);
  p.rect(52, 22, 36, 26, X.paper2);
  p.rect(52, 22, 36, 1, X.marbleD);
  const heights = [6, 12, 9, 16, 13];
  const progress = on ? (f % 30) / 18 : mood === 'trouble' ? 0.3 : 1;
  heights.forEach((h, i) => {
    const shown = Math.max(1, Math.min(h, Math.round(progress * 5 * h - i * h)));
    p.rect(56 + i * 6, 44 - shown, 4, shown, mood === 'trouble' && i > 2 ? X.r : X.code3);
  });
  p.rect(54, 44, 32, 1, X.ink);
  if (mood === 'trouble') smoke(p, f, x, 12);
  marks(p, f, mood, x + 14, 8, X.w);
};

const typist: PixelScene = (p, f, mood) => {
  factory(p, f, mood);
  const on = mood === 'working';
  const x = 46;
  p.sprite(() => {
    p.rect(x - 22, 42, 44, 3, X.woodD);
    p.rect(x - 20, 45, 3, 5, X.woodD);
    p.rect(x + 17, 45, 3, 5, X.woodD);
    p.rect(x - 18, 39, 14, 3, X.steelL);
    p.rect(x + 4, 39, 14, 3, X.steelL);
    p.rect(x - 6, 26, 12, 14, X.steel);
    p.rect(x - 8, 12, 16, 12, X.steelD);
    p.rect(x - 7, 13, 14, 10, X.screen);
    if (mood === 'idle') p.rect(x - 5, 17, 10, 1, X.scaleD);
    else
      for (let i = 0; i < 4; i++)
        p.rect(
          x - 6 + (i % 2) * 2,
          14 + i * 2,
          4 + ((i + (on ? Math.floor(f / 2) : 0)) % 4) * 2,
          1,
          mood === 'trouble' ? X.r : [X.code1, X.code2, X.code3, X.code4][i],
        );
    p.rect(x - 1, 24, 2, 2, X.iron);
    const arms: [number, number][] = [
      [-16, 0],
      [-10, 0],
      [8, 0],
      [14, 0],
    ];
    arms.forEach(([dx], i) => {
      const lift = on && (f + i) % 2 === 0 ? 2 : 0;
      p.line(x + (dx < 0 ? -6 : 5), 28 + (i % 2) * 3, x + dx, 37 - lift, X.ironL);
      p.rect(x + dx - 1, 37 - lift, 2, 2, X.steelL);
    });
  }, X.k);
  if (mood === 'trouble') {
    sparkle(p, f, x - 18, 34, X.spark);
    sparkle(p, f + 3, x + 18, 36, X.spark);
  }
  if (on) glow(p, x, 18, 10, X.code3, 0.15);
  marks(p, f, mood, x + 10, 6, X.w);
};

const vault: PixelScene = (p, f, mood) => {
  factory(p, f, mood);
  p.rect(60, 12, 32, 38, X.steelL);
  p.ellipse(76, 31, 12, 12, X.steel);
  p.ellipse(76, 31, 8, 8, X.steelL);
  const turn = mood === 'working' ? f % 4 : 0;
  for (let s = 0; s < 4; s++) {
    const a = ((s + turn / 4) / 4) * Math.PI * 2;
    p.line(76, 31, 76 + Math.cos(a) * 7, 31 + Math.sin(a) * 7, X.iron, 2);
  }
  const lamp = mood === 'trouble' ? (f % 4 < 2 ? X.r : X.rl) : X.code1;
  p.rect(74, 14, 5, 3, lamp);
  glow(p, 76, 15, 6, lamp, 0.3);
  const x = 30;
  p.sprite(() => {
    p.rect(x - 12, 44, 24, 6, X.k);
    for (let i = 0; i < 6; i++)
      p.rect(x - 11 + i * 4 + (mood === 'working' ? f % 2 : 0), 46, 2, 2, X.ironL);
    p.rect(x - 9, 28, 18, 16, X.iron);
    p.rect(x - 9, 28, 18, 2, X.ironL);
    p.rect(x - 6, 18, 12, 10, X.steel);
    p.rect(x - 5, 21, 10, 3, X.k);
    leds(p, f, mood, x, 21, 3);
    const guarding = mood === 'working' || mood === 'trouble';
    p.rect(guarding ? x + 8 : x - 16, 26, 7, 16, X.steelL);
    p.rect(guarding ? x + 10 : x - 14, 30, 3, 8, lamp);
    p.line(x - 9, 32, x - 14, 38, X.ironL, 2);
  }, X.k);
  if (mood === 'working')
    for (let k = 0; k < 2; k++) {
      const t = (f * 2 + k * 20) % 30;
      const px = 58 - t;
      if (px > 40) {
        p.rect(px, 24 + k * 8, 4, 3, X.w);
        p.set(px + 1, 25 + k * 8, X.green);
      }
    }
  if (mood === 'trouble') smoke(p, f, x, 14);
  marks(p, f, mood, x + 10, 8, X.w);
};

export const MACHINES: Readonly<Record<string, PixelScene>> = {
  assistant: dispatch,
  kitchen: kettlebot,
  travel: rover,
  observation: sentinel,
  analysis: calcotron,
  coding: typist,
  security: vault,
};
