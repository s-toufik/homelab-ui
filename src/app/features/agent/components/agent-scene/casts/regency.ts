import type { AgentMood } from '../../../domain/agent-activity';
import { HEIGHT, PixelFrame, WIDTH } from '../pixel-frame';
import {
  X,
  candle,
  figure,
  glow,
  marks,
  pose,
  smoke,
  type Look,
  type PixelScene,
  type Point,
} from './kit';

function parlour(p: PixelFrame, f: number, mood: AgentMood): void {
  for (let x = 0; x < WIDTH; x++)
    p.rect(x, 0, 1, 38, Math.floor(x / 4) % 2 ? X.wallpaper : X.wallpaperD);
  for (let x = 2; x < WIDTH; x += 8)
    for (let y = 4; y < 36; y += 8) p.set(x + ((y / 8) % 2) * 4, y, X.w);
  p.rect(0, 38, WIDTH, 14, X.paper2);
  p.rect(0, 38, WIDTH, 2, X.gilt);
  for (let x = 4; x < WIDTH; x += 16) {
    p.rect(x, 42, 12, 8, X.paper2);
    p.rect(x, 42, 12, 1, X.marbleD);
    p.rect(x, 49, 12, 1, X.marbleD);
    p.rect(x, 42, 1, 8, X.marbleD);
    p.rect(x + 11, 42, 1, 8, X.marbleD);
  }
  for (let y = 52; y < HEIGHT; y++)
    for (let x = 0; x < WIDTH; x++) p.set(x, y, ((x + y) >> 2) % 2 ? X.wood : X.woodL);
  p.rect(0, 52, WIDTH, 1, X.woodD);
  p.rect(47, 0, 2, 4, X.gilt);
  p.rect(38, 4, 20, 2, X.gilt);
  for (const [x, phase] of [
    [38, 0],
    [46, 1],
    [55, 2],
  ]) {
    glow(p, x + 1, 1, 5, X.yl, mood === 'idle' ? 0.15 : 0.3);
    candle(p, f, x, 1, phase);
  }
}

const hostess: PixelScene = (p, f, mood) => {
  parlour(p, f, mood);
  const look: Look = {
    skin: X.s,
    hair: X.b,
    hairStyle: 'bun',
    robe: X.blush,
    robeDark: X.rose,
    trim: X.w,
    skirt: true,
  };
  const hands = pose(
    40,
    52,
    mood,
    f,
    [
      [8, 2],
      [8, 1],
    ],
    [
      [-9, 0],
      [-10, -2],
    ],
  );
  p.sprite(() => {
    figure(p, f, mood, 40, 52, look, hands);
    p.rect(40, 23, 1, 3, X.w);
    p.set(41, 22, X.w);
    p.rect(hands.right[0], hands.right[1] - 6, 5, 7, X.w);
    const ticked = mood === 'working' ? Math.floor(f / 4) % 4 : 3;
    for (let i = 0; i < 3; i++) {
      p.rect(hands.right[0] + 1, hands.right[1] - 5 + i * 2, 3, 1, X.marbleD);
      if (i < ticked) p.set(hands.right[0] + 4, hands.right[1] - 5 + i * 2, X.r);
    }
    const fan = hands.left;
    p.line(fan[0], fan[1], fan[0] - 4, fan[1] - 4 + (mood === 'working' ? f % 2 : 0), X.code2);
    p.line(fan[0], fan[1], fan[0] - 5, fan[1] - 1, X.code2);
    p.line(fan[0], fan[1], fan[0] - 3, fan[1] - 5, X.code2);
  }, X.k);
  if (mood === 'working')
    for (let k = 0; k < 3; k++) {
      const t = (f + k * 8) % 24;
      p.rect(90 - t * 1.6, 18 + k * 6, 4, 3, X.w);
      p.set(91 - t * 1.6, 19 + k * 6, X.gilt);
    }
  if (mood === 'trouble')
    for (let k = 0; k < 4; k++) p.rect(52 + k * 7, 54 + (k % 2) * 3, 4, 3, X.w);
  marks(p, f, mood, 48, 18);
};

const cook: PixelScene = (p, f, mood) => {
  parlour(p, f, mood);
  const lit = mood !== 'idle';
  const look: Look = {
    skin: X.s,
    hair: X.y,
    hairStyle: 'curls',
    robe: X.code3,
    robeDark: X.robeBlue,
    trim: X.w,
    hat: 'bonnet',
    hatColor: X.w,
    hatTrim: X.w,
    skirt: true,
  };
  const hands = pose(26, 52, mood, f, [
    [18, -2],
    [20, -3],
    [19, -1],
  ]);
  p.sprite(() => {
    p.rect(44, 36, 40, 16, X.k);
    p.rect(46, 44, 10, 6, lit ? X.ember : X.iron);
    p.rect(60, 44, 10, 6, lit ? X.ember : X.iron);
    p.rect(42, 34, 44, 2, X.iron);
    p.rect(48, 28, 12, 6, X.copper);
    p.rect(47, 28, 14, 1, X.copperD);
    p.rect(64, 26, 14, 8, X.copper);
    p.rect(63, 26, 16, 1, X.copperD);
    p.rect(78, 29, 4, 1, X.copperD);
    p.rect(26 - 6, 38, 12, 12, X.w);
    figure(p, f, mood, 26, 52, look, hands);
    p.rect(22, 40, 9, 9, X.w);
    if (mood === 'working') p.line(hands.right[0] + 1, hands.right[1], 52 + (f % 4), 27, X.woodD);
  }, X.k);
  if (lit)
    for (let s = 0; s < 2; s++)
      for (let k = 0; k < 4; k++) {
        const y = 24 - ((f + s * 5 + k * 3) % 14);
        p.set(52 + s * 18 + Math.round(Math.sin(y / 2)), y, k % 2 ? X.w : X.g);
      }
  if (mood === 'trouble') smoke(p, f, 70, 22);
  marks(p, f, mood, 34, 18);
};

const coachman: PixelScene = (p, f, mood) => {
  p.dither(0, 0, WIDTH, 36, X.aegeanL, X.w, (_, j) => (j / 36) * 0.8);
  const roll = mood === 'working' ? f : 0;
  for (let x = 0; x < WIDTH; x++) {
    const h = 6 + Math.round(Math.abs(Math.sin((x + roll * 2) / 7)) * 5);
    p.rect(x, 40 - h, 1, h, X.grassD);
  }
  p.rect(0, 40, WIDTH, 24, X.path);
  for (let k = 0; k < 6; k++)
    p.rect(((((k * 19 - roll * 3) % 110) + 110) % 110) - 8, 50 + (k % 3) * 4, 5, 1, X.pathD);
  p.sprite(() => {
    p.rect(40, 26, 44, 20, X.robeBlue);
    p.rect(40, 26, 44, 2, X.gilt);
    p.rect(54, 30, 12, 10, X.aegeanL);
    p.rect(59, 30, 1, 10, X.gilt);
    p.rect(30, 34, 12, 3, X.woodD);
    const wheel = (cx: number, cy: number, r: number) => {
      p.ellipse(cx, cy, r, r, X.woodD);
      p.ellipse(cx, cy, r - 2, r - 2, X.path);
      for (let s = 0; s < 4; s++) {
        const a = ((s + roll / 2) / 4) * Math.PI;
        p.line(
          cx - Math.cos(a) * (r - 2),
          cy - Math.sin(a) * (r - 2),
          cx + Math.cos(a) * (r - 2),
          cy + Math.sin(a) * (r - 2),
          X.woodD,
        );
      }
      p.ellipse(cx, cy, 1.5, 1.5, X.gilt);
    };
    wheel(48, 48, 8);
    wheel(76, 48, 8);
    const look: Look = {
      skin: X.s,
      hair: X.g,
      hairStyle: 'short',
      robe: X.crimson,
      robeDark: X.crimsonD,
      trim: X.gilt,
      hat: 'tophat',
      hatColor: X.k,
      hatTrim: X.gilt,
    };
    const hands = pose(34, 34, mood, f, [
      [-6, -6],
      [-10, -2],
    ]);
    figure(p, f, mood, 34, 34, look, hands);
    if (mood === 'working') {
      const tip: Point =
        f % 4 < 2
          ? [hands.right[0] - 10, hands.right[1] - 8]
          : [hands.right[0] - 12, hands.right[1] + 2];
      p.line(hands.right[0], hands.right[1], tip[0], tip[1], X.k);
    }
  }, X.k);
  marks(p, f, mood, 42, 4);
};

const gazer: PixelScene = (p, f, mood) => {
  parlour(p, f, mood);
  for (let y = 8; y < 38; y++)
    for (let x = 56; x < 86; x++) p.set(x, y, y < 26 ? X.aegeanL : X.grass);
  for (let k = 0; k < 4; k++) p.ellipse(60 + k * 8, 27, 4, 3, X.grassD);
  p.rect(70, 8, 1, 30, X.w);
  p.rect(56, 22, 30, 1, X.w);
  p.rect(52, 6, 5, 34, X.rose);
  p.rect(85, 6, 5, 34, X.rose);
  p.rect(50, 5, 42, 2, X.gilt);
  const look: Look = {
    skin: X.s,
    hair: X.o,
    hairStyle: 'curls',
    robe: X.code2,
    robeDark: X.purple,
    trim: X.w,
    skirt: true,
  };
  const hands = pose(
    36,
    52,
    mood,
    f,
    [
      [6, -12],
      [7, -12],
    ],
    [[2, -12]],
  );
  p.sprite(() => {
    figure(p, f, mood, 36, 52, look, hands);
    if (mood === 'working') {
      p.rect(hands.right[0] - 3, hands.right[1] - 1, 6, 2, X.gilt);
      p.line(
        hands.right[0] + 1,
        hands.right[1] + 1,
        hands.right[0] + 1,
        hands.right[1] + 6,
        X.gilt,
      );
    }
  }, X.k);
  if (mood === 'working' && f % 8 < 4) {
    p.rect(64 + (f % 3) * 4, 14, 3, 2, X.w);
    p.set(65 + (f % 3) * 4, 16, X.w);
  }
  marks(p, f, mood, 44, 18);
};

const accountant: PixelScene = (p, f, mood) => {
  parlour(p, f, mood);
  const look: Look = { skin: X.s, robe: X.robeBlue, robeDark: X.k, trim: X.gilt, hat: 'wig' };
  const hands = pose(28, 52, mood, f, [
    [16, -2],
    [17, -3],
  ]);
  p.sprite(() => {
    p.rect(40, 40, 36, 3, X.woodD);
    p.rect(42, 43, 3, 9, X.woodD);
    p.rect(71, 43, 3, 9, X.woodD);
    p.rect(46, 35, 22, 5, X.paper2);
    p.rect(57, 35, 1, 5, X.marbleD);
    p.rect(70, 36, 3, 4, X.k);
    figure(p, f, mood, 28, 52, look, hands);
    if (mood === 'working')
      p.line(hands.right[0] + 1, hands.right[1], hands.right[0] + 4, hands.right[1] - 6, X.w);
  }, X.k);
  const rows = mood === 'working' ? Math.floor(f / 3) % 5 : 4;
  for (let i = 0; i < rows; i++) {
    p.rect(47, 36 + (i % 2) * 2, 2 + ((i * 3) % 6), 1, X.ink);
    p.rect(
      59,
      36 + (i % 2) * 2,
      2 + ((i * 5) % 6),
      1,
      i === rows - 1 && mood === 'trouble' ? X.r : X.ink,
    );
  }
  candle(p, f, 76, 34, 1);
  marks(p, f, mood, 36, 18);
};

const writer: PixelScene = (p, f, mood) => {
  parlour(p, f, mood);
  const look: Look = {
    skin: X.s,
    hair: X.k,
    hairStyle: 'bun',
    robe: X.olive,
    robeDark: X.scaleD,
    trim: X.w,
    skirt: true,
  };
  const hands = pose(28, 52, mood, f, [
    [16, -2],
    [18, -3],
  ]);
  const stack = mood === 'working' ? 1 + (Math.floor(f / 6) % 4) : 3;
  p.sprite(() => {
    p.rect(40, 40, 38, 3, X.wood);
    p.rect(42, 43, 3, 9, X.woodD);
    p.rect(73, 43, 3, 9, X.woodD);
    p.rect(46, 36, 12, 4, X.paper2);
    for (let i = 0; i < stack; i++) {
      p.rect(64, 38 - i * 2, 9, 2, X.w);
      p.set(68, 38 - i * 2, X.crimson);
    }
    p.rect(60, 37, 2, 3, X.k);
    figure(p, f, mood, 28, 52, look, hands);
    if (mood === 'working')
      p.line(hands.right[0] + 1, hands.right[1], hands.right[0] + 3, hands.right[1] - 7, X.w);
  }, X.k);
  const written = mood === 'working' ? f % 10 : 10;
  for (let i = 0; i < written; i++) if (i % 4 !== 3) p.set(47 + i, 37 + (i > 5 ? 1 : 0), X.ink);
  if (mood === 'trouble') for (let k = 0; k < 4; k++) p.set(48 + k * 2, 38 + ((f + k) % 3), X.k);
  marks(p, f, mood, 36, 18);
};

const butler: PixelScene = (p, f, mood) => {
  parlour(p, f, mood);
  p.rect(58, 6, 30, 46, X.woodD);
  p.rect(60, 8, 12, 18, X.wood);
  p.rect(74, 8, 12, 18, X.wood);
  p.rect(60, 30, 12, 20, X.wood);
  p.rect(74, 30, 12, 20, X.wood);
  p.rect(70, 30, 2, 3, X.gilt);
  const look: Look = {
    skin: X.s,
    hair: X.g,
    hairStyle: 'short',
    robe: X.k,
    robeDark: X.tails,
    trim: X.w,
  };
  const hands = pose(32, 52, mood, f, [
    [8, -3],
    [8, -4],
  ]);
  p.sprite(() => {
    figure(p, f, mood, 32, 52, look, hands);
    p.set(34, 33, X.gilt);
    p.set(35, 34, X.gilt);
    p.set(36, 34, X.gilt);
    p.rect(hands.left[0], hands.left[1], 2, 2, X.w);
    p.rect(hands.right[0], hands.right[1], 2, 2, X.w);
    if (mood !== 'trouble') {
      p.rect(hands.right[0] - 3, hands.right[1] - 1, 10, 1, X.steelL);
      p.rect(hands.right[0] - 1, hands.right[1] - 3, 5, 2, X.w);
    }
  }, X.k);
  if (mood === 'working')
    for (let k = 0; k < 2; k++) {
      const t = (f + k * 10) % 20;
      p.rect(56 - t * 0.8, 20 + k * 6, 5, 3, X.w);
      p.set(58 - t * 0.8, 21 + k * 6, X.crimson);
    }
  if (mood === 'trouble') {
    p.rect(30, 56, 10, 1, X.steelL);
    p.rect(22, 58, 5, 3, X.w);
    p.rect(42, 55, 5, 3, X.w);
  }
  marks(p, f, mood, 40, 18);
};

export const REGENCY: Readonly<Record<string, PixelScene>> = {
  assistant: hostess,
  kitchen: cook,
  travel: coachman,
  observation: gazer,
  analysis: accountant,
  coding: writer,
  security: butler,
};
