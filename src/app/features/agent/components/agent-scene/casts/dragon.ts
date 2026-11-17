import type { AgentMood } from '../../../domain/agent-activity';
import { HEIGHT, PixelFrame, WIDTH, type Color } from '../pixel-frame';
import {
  X,
  figure,
  glow,
  ground,
  marks,
  pose,
  smoke,
  type Look,
  type PixelScene,
  type Point,
} from './kit';

function triangle(p: PixelFrame, a: Point, b: Point, c: Point, color: Color): void {
  const minX = Math.floor(Math.min(a[0], b[0], c[0]));
  const maxX = Math.ceil(Math.max(a[0], b[0], c[0]));
  const minY = Math.floor(Math.min(a[1], b[1], c[1]));
  const maxY = Math.ceil(Math.max(a[1], b[1], c[1]));
  const side = (p1: Point, p2: Point, x: number, y: number) =>
    (p2[0] - p1[0]) * (y - p1[1]) - (p2[1] - p1[1]) * (x - p1[0]);
  for (let y = minY; y <= maxY; y++)
    for (let x = minX; x <= maxX; x++) {
      const d1 = side(a, b, x + 0.5, y + 0.5);
      const d2 = side(b, c, x + 0.5, y + 0.5);
      const d3 = side(c, a, x + 0.5, y + 0.5);
      const negative = d1 < 0 || d2 < 0 || d3 < 0;
      const positive = d1 > 0 || d2 > 0 || d3 > 0;
      if (!(negative && positive)) p.set(x, y, color);
    }
}

function camp(p: PixelFrame, f: number, mood: AgentMood): void {
  p.dither(
    0,
    0,
    WIDTH,
    52,
    X.obsidian,
    X.obsidianL,
    (i, j) => 0.2 + ((i * 7 + j * 3) % 9) / 30 + (j / 52) * 0.2,
  );
  for (let y = 30; y < 52; y++)
    for (let x = 0; x < WIDTH; x++) p.speckle(x, y, X.crimsonD, ((y - 30) / 22) * 0.45);
  if (mood !== 'idle')
    for (let k = 0; k < 6; k++) {
      const rise = (f + k * 5) % 30;
      p.set((k * 17 + Math.floor(rise / 4)) % WIDTH, 50 - rise, k % 2 ? X.ember : X.emberL);
    }
  ground(p, 52, X.ash, X.obsidian, X.ironL);
}

function fire(p: PixelFrame, f: number, x: number, y: number, size: number): void {
  for (let i = 0; i < size; i++) {
    const h = 2 + ((f + i * 3) % 3) + (i === Math.floor(size / 2) ? 2 : 0);
    p.rect(x + i * 2, y - h, 2, h, (f + i) % 2 ? X.ember : X.o);
    p.set(x + i * 2, y - h, X.y);
  }
}

const RIDER: Look = {
  skin: X.s,
  hair: X.r,
  hairStyle: 'wild',
  robe: X.obsidianL,
  robeDark: X.k,
  trim: X.ember,
};

const leader: PixelScene = (p, f, mood) => {
  camp(p, f, mood);
  p.rect(0, 4, 3, 30, X.crimson);
  p.rect(93, 4, 3, 30, X.crimson);
  const hands = pose(26, 52, mood, f, [
    [18, 2],
    [24, 1],
    [20, 3],
  ]);
  p.sprite(() => {
    p.rect(40, 38, 46, 3, X.woodD);
    p.rect(44, 41, 3, 11, X.woodD);
    p.rect(80, 41, 3, 11, X.woodD);
    p.rect(42, 35, 42, 3, X.paper);
    figure(p, f, mood, 26, 52, RIDER, hands);
  }, X.k);
  p.line(48, 36, 60, 37, X.owl);
  p.line(60, 37, 76, 35, X.owl);
  const shift = mood === 'working' ? Math.floor(f / 3) % 6 : 0;
  p.rect(50 + shift, 36, 2, 1, X.ember);
  p.rect(66 - shift, 36, 2, 1, X.code3);
  p.rect(74, 35 + (shift % 2), 2, 1, X.gold);
  if (mood === 'trouble') smoke(p, f, 62, 30);
  marks(p, f, mood, 34, 18, X.emberL);
};

const cook: PixelScene = (p, f, mood) => {
  camp(p, f, mood);
  const lit = mood !== 'idle';
  glow(p, 62, 44, 18, X.ember, lit ? 0.35 : 0.12);
  const look: Look = {
    skin: X.sd,
    hair: X.b,
    hairStyle: 'short',
    beard: X.b,
    robe: X.owl,
    robeDark: X.owlD,
    hat: 'cap',
    hatColor: X.crimson,
  };
  const turn = Math.floor(f / 2) % 4;
  const crank: Point[] = [
    [20, 2],
    [22, 0],
    [20, -2],
    [18, 0],
  ];
  const hands = pose(28, 52, mood, f, crank);
  p.sprite(() => {
    p.rect(48, 30, 2, 22, X.woodD);
    p.rect(76, 30, 2, 22, X.woodD);
    p.rect(46, 32, 34, 1, X.iron);
    p.ellipse(62, 36, 7, 4, turn % 2 ? X.copperD : X.copper);
    p.rect(58, 35, 2, 1, X.yl);
    p.rect(52, 48, 22, 3, X.woodD);
    figure(p, f, mood, 28, 52, look, hands);
  }, X.k);
  if (lit) fire(p, f, 54, 49, 9);
  else for (let i = 0; i < 5; i++) p.set(55 + i * 4, 48, X.ember);
  if (mood === 'trouble') smoke(p, f, 62, 28);
  marks(p, f, mood, 36, 18, X.emberL);
};

function dragon(p: PixelFrame, f: number, x: number, y: number, mood: AgentMood): void {
  const up = mood === 'working' ? f % 4 < 2 : mood !== 'idle';
  if (mood === 'idle') {
    triangle(p, [x - 6, y - 3], [x + 6, y - 9], [x + 8, y - 2], X.scaleD);
  } else if (up) {
    triangle(p, [x - 4, y - 4], [x - 8, y - 22], [x + 8, y - 8], X.scaleD);
  } else {
    triangle(p, [x - 4, y - 2], [x - 12, y + 10], [x + 6, y + 2], X.scaleD);
  }
  p.line(x - 11, y, x - 22, y - 5 + (mood === 'working' ? f % 2 : 0), X.scale, 2);
  triangle(p, [x - 23, y - 7], [x - 25, y - 3], [x - 20, y - 4], X.ember);
  p.ellipse(x, y, 12, 6, X.scale);
  p.ellipse(x + 1, y + 2, 9, 3, X.scaleL);
  const head: Point = mood === 'idle' ? [x + 13, y + 2] : [x + 17, y - 9];
  p.line(x + 9, y - 2, head[0] - 3, head[1] + 1, X.scale, 3);
  p.ellipse(head[0], head[1], 4.5, 3, X.scale);
  p.rect(head[0] + 2, head[1] + 1, 4, 2, X.scaleL);
  p.set(head[0] - 2, head[1] - 4, X.marble);
  p.set(head[0] - 1, head[1] - 3, X.marble);
  if (mood === 'idle') p.rect(head[0], head[1] - 1, 2, 1, X.k);
  else p.set(head[0] + 1, head[1] - 1, mood === 'trouble' ? X.r : X.eye);
  if (mood !== 'idle') {
    p.rect(x - 5, y + 5, 2, 3, X.scaleD);
    p.rect(x + 5, y + 5, 2, 3, X.scaleD);
  }
}

const rider: PixelScene = (p, f, mood) => {
  p.dither(0, 0, WIDTH, HEIGHT, X.crimsonD, X.obsidian, (_, j) => (j / HEIGHT) * 1.1);
  p.ellipse(16, 14, 5, 5, X.emberL);
  const scroll = mood === 'working' ? Math.floor(f / 2) : 0;
  for (let x = 0; x < WIDTH; x++) {
    const wx = x + scroll;
    const h = 14 + Math.round(Math.abs(Math.sin(wx / 9)) * 12) + ((wx * 13) % 4);
    p.rect(x, HEIGHT - h, 1, h, X.obsidianL);
    const near = 6 + Math.round(Math.abs(Math.sin(wx / 5 + 1)) * 6);
    p.rect(x, HEIGHT - near, 1, near, X.obsidian);
  }
  const idle = mood === 'idle';
  const x = idle ? 46 : 44;
  const y = idle ? 52 : 30 + (mood === 'working' ? Math.round(Math.sin(f / 3) * 2) : 0);
  if (idle) p.rect(28, 54, 40, 10, X.obsidianL);
  p.sprite(() => {
    dragon(p, f, x, y, mood);
    const rx = x - 1;
    const ry = y - 6;
    p.rect(rx - 2, ry - 2, 5, 5, X.obsidianL);
    p.ellipse(rx, ry - 5, 2.5, 2.5, X.s);
    p.ellipse(rx, ry - 7, 2.6, 1.4, X.r);
    if (mood === 'trouble') {
      p.rect(rx - 4, ry - 9, 1, 4, X.obsidianL);
      p.rect(rx + 3, ry - 9, 1, 4, X.obsidianL);
    }
    if (mood === 'working') p.rect(rx - 6, ry - 6 + (f % 2), 4, 1, X.crimson);
  }, X.k);
  if (mood === 'trouble') smoke(p, f, x + 22, y - 8);
  if (mood === 'working' && f % 6 < 3) {
    p.rect(x + 22, y - 10, 3, 2, X.o);
    p.set(x + 25, y - 10, X.y);
  }
  marks(p, f, mood, x + 6, idle ? 30 : y - 22, X.emberL);
};

const scout: PixelScene = (p, f, mood) => {
  p.dither(0, 0, WIDTH, 44, X.sky, X.crimsonD, (_, j) => (j / 44) * 0.9);
  for (let x = 0; x < WIDTH; x++) {
    const h = 6 + Math.round(Math.abs(Math.sin(x / 8)) * 6);
    p.rect(x, 44 - h, 1, h, X.obsidianL);
  }
  p.rect(0, 44, WIDTH, 20, X.stoneD);
  for (let x = 0; x < WIDTH; x += 10) p.rect(x, 38, 6, 6, X.stone);
  p.rect(0, 44, WIDTH, 1, X.stoneL);
  const beacon = mood === 'trouble' ? 14 : mood === 'idle' ? 4 : 8;
  glow(p, 78, 32, beacon + 6, X.ember, 0.35);
  const look: Look = {
    skin: X.s,
    hair: X.b,
    hairStyle: 'short',
    robe: X.iron,
    robeDark: X.k,
    trim: X.ember,
    hat: 'helm',
    hatColor: X.ironL,
    hatTrim: X.ember,
  };
  const hands = pose(
    34,
    44,
    mood,
    f,
    [
      [8, -14],
      [8, -15],
    ],
    [[3, -13]],
  );
  p.sprite(() => {
    p.rect(72, 34, 12, 4, X.iron);
    p.rect(76, 38, 4, 6, X.iron);
    figure(p, f, mood, 34, 44, look, hands);
    if (mood === 'working') {
      const end: Point = [hands.right[0] + 12, hands.right[1] - 2 + (Math.floor(f / 4) % 3)];
      p.line(hands.right[0], hands.right[1], end[0], end[1], X.gold, 2);
    }
  }, X.k);
  for (let i = 0; i < 6; i++) {
    const h = 2 + ((f + i) % 3) + Math.floor(beacon / 3);
    p.rect(
      73 + i * 2,
      34 - h,
      2,
      h,
      mood === 'trouble' && i % 2 ? X.r : (f + i) % 2 ? X.ember : X.y,
    );
  }
  marks(p, f, mood, 42, 12, X.emberL);
};

const quartermaster: PixelScene = (p, f, mood) => {
  camp(p, f, mood);
  const look: Look = {
    skin: X.s,
    hair: X.g,
    hairStyle: 'short',
    beard: X.g,
    robe: X.olive,
    robeDark: X.scaleD,
  };
  const hands = pose(26, 52, mood, f, [
    [16, -2],
    [18, -2],
  ]);
  p.sprite(() => {
    p.rect(64, 38, 14, 14, X.wood);
    p.rect(64, 44, 14, 1, X.woodD);
    p.rect(78, 42, 12, 10, X.wood);
    p.rect(38, 40, 24, 3, X.woodD);
    p.rect(40, 43, 3, 9, X.woodD);
    p.rect(57, 43, 3, 9, X.woodD);
    p.rect(42, 34, 16, 6, X.woodL);
    for (let row = 0; row < 3; row++) {
      p.rect(42, 35 + row * 2, 16, 1, X.iron);
      for (let b = 0; b < 4; b++) {
        const moved = mood === 'working' && (Math.floor(f / 2) + row + b) % 5 === 0 ? 6 : 0;
        p.set(44 + b * 2 + moved, 35 + row * 2, [X.r, X.y, X.code3][row]);
      }
    }
    figure(p, f, mood, 26, 52, look, hands);
  }, X.k);
  if (mood === 'trouble') for (let k = 0; k < 5; k++) p.set(42 + k * 4, 50 - ((f + k) % 4), X.y);
  marks(p, f, mood, 34, 18, X.emberL);
};

const smith: PixelScene = (p, f, mood) => {
  camp(p, f, mood);
  const lit = mood !== 'idle';
  glow(p, 76, 40, 16, X.ember, lit ? 0.45 : 0.15);
  const look: Look = {
    skin: X.sd,
    hair: X.k,
    hairStyle: 'short',
    robe: X.owlD,
    robeDark: X.k,
    trim: X.owl,
  };
  const strike = mood === 'working' && f % 4 < 2;
  const hands = pose(30, 52, mood, f, [
    [14, -10],
    [14, 0],
  ]);
  p.sprite(() => {
    p.rect(66, 30, 20, 22, X.stoneD);
    p.rect(70, 36, 12, 8, lit ? X.ember : X.obsidianL);
    p.rect(44, 44, 16, 3, X.iron);
    p.rect(48, 47, 8, 5, X.iron);
    p.rect(46, 42, 10, 2, lit ? X.emberL : X.ironL);
    figure(p, f, mood, 30, 52, look, hands);
    if (mood === 'working') {
      const head: Point = strike ? [52, 38] : [hands.right[0] + 2, hands.right[1] - 4];
      p.line(hands.right[0], hands.right[1], head[0], head[1], X.woodD);
      p.rect(head[0] - 1, head[1] - 2, 4, 3, X.ironL);
    }
  }, X.k);
  if (strike)
    for (let k = 0; k < 6; k++)
      p.set(50 + ((k * 5 + f) % 10) - 2, 40 - ((k * 3 + f) % 6), k % 2 ? X.y : X.emberL);
  if (mood === 'trouble') smoke(p, f, 76, 26);
  marks(p, f, mood, 38, 18, X.emberL);
};

const guard: PixelScene = (p, f, mood) => {
  camp(p, f, mood);
  for (let y = 10; y < 52; y++) for (let x = 56; x < 90; x++) p.set(x, y, X.k);
  const blink = f % 40 < 2 || mood === 'idle';
  const eye = mood === 'trouble' ? X.r : X.eye;
  if (!blink) {
    p.ellipse(73, 26, 6, 3, eye);
    p.rect(73, 23, 1, 7, X.k);
  } else p.rect(67, 26, 12, 1, eye);
  for (let x = 56; x < 90; x += 4) p.rect(x, 10, 1, 42, X.iron);
  for (let y = 16; y < 52; y += 7) p.rect(56, y, 34, 1, X.iron);
  p.rect(54, 8, 38, 2, X.stoneD);
  const look: Look = {
    skin: X.s,
    hair: X.b,
    hairStyle: 'short',
    robe: X.iron,
    robeDark: X.k,
    trim: X.ember,
    hat: 'helm',
    hatColor: X.ironL,
    hatTrim: X.crimson,
  };
  const guarding = mood === 'working' || mood === 'trouble';
  const hands = pose(30, 52, mood, f, [
    [9, 3],
    [9, 2],
  ]);
  p.sprite(() => {
    p.line(hands.right[0] + 1, hands.right[1] + 10, hands.right[0] + 1, 18, X.woodD);
    p.rect(hands.right[0], 15, 3, 3, X.ironL);
    figure(p, f, mood, 30, 52, look, hands);
    const sx = guarding ? 36 : 22;
    p.ellipse(sx, 44, 6, 6, X.crimson);
    p.ellipse(sx, 44, 3, 3, X.gold);
  }, X.k);
  marks(p, f, mood, 38, 18, X.emberL);
};

export const DRAGON: Readonly<Record<string, PixelScene>> = {
  assistant: leader,
  kitchen: cook,
  travel: rider,
  observation: scout,
  analysis: quartermaster,
  coding: smith,
  security: guard,
};
