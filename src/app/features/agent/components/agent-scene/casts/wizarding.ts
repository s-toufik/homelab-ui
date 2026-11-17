import type { AgentMood } from '../../../domain/agent-activity';
import { HEIGHT, PixelFrame, WIDTH } from '../pixel-frame';
import {
  X,
  candle,
  figure,
  glow,
  ground,
  marks,
  pose,
  smoke,
  sparkle,
  type Look,
  type PixelScene,
} from './kit';

function hall(p: PixelFrame, f: number, mood: AgentMood): void {
  p.dither(0, 0, WIDTH, 52, X.owlD, X.ash, (_, j) => 0.25 + (j / 52) * 0.4);
  for (let y = 6; y < 50; y += 7) {
    p.rect(0, y, WIDTH, 1, X.ash);
    const offset = (y / 7) % 2 ? 0 : 7;
    for (let x = offset; x < WIDTH; x += 14) p.rect(x, y - 6, 1, 6, X.ash);
  }
  for (const [x, y, phase] of [
    [10, 6, 0],
    [30, 3, 1],
    [66, 4, 2],
    [86, 7, 1],
  ]) {
    const bob = mood === 'idle' ? 0 : Math.round(Math.sin((f + phase * 5) / 4));
    glow(p, x + 1, y + bob, 5, X.yl, 0.35);
    candle(p, f, x, y + bob + 1, phase);
  }
  ground(p, 52, X.wood, X.woodD, X.woodL);
}

function wand(
  p: PixelFrame,
  f: number,
  from: readonly [number, number],
  tip: readonly [number, number],
): void {
  p.line(from[0], from[1], tip[0], tip[1], X.woodD);
  sparkle(p, f, tip[0], tip[1] - 1, X.yl);
}

function owl(p: PixelFrame, x: number, y: number, flap: boolean): void {
  p.rect(x, y, 3, 3, X.owl);
  p.set(x + 1, y + 1, X.eye);
  p.set(x - 1, y + (flap ? -1 : 1), X.owlD);
  p.set(x + 3, y + (flap ? -1 : 1), X.owlD);
  p.rect(x + 1, y + 3, 2, 1, X.w);
}

const ARCHMAGE: Look = {
  skin: X.s,
  hair: X.w,
  hairStyle: 'long',
  beard: X.w,
  robe: X.purple,
  robeDark: X.purpleD,
  trim: X.gold,
  hat: 'pointy',
  hatColor: X.purple,
  hatTrim: X.gold,
};

const archmage: PixelScene = (p, f, mood) => {
  hall(p, f, mood);
  p.rect(30, 46, 36, 6, X.crimsonD);
  p.rect(30, 46, 36, 1, X.crimson);
  const hands = pose(48, 46, mood, f, [
    [8, 1],
    [9, -3],
    [7, -6],
    [5, -2],
  ]);
  p.sprite(() => {
    figure(p, f, mood, 48, 46, ARCHMAGE, hands);
    const tip: [number, number] = [hands.right[0] + 4, hands.right[1] - 5];
    if (mood !== 'idle') wand(p, f, hands.right, tip);
  }, X.k);
  if (mood === 'working')
    for (let k = 0; k < 4; k++) {
      const t = (f + k * 6) % 24;
      const dir = k % 2 ? 1 : -1;
      const x = 48 + dir * (8 + t * 1.7);
      const y = 22 - t * 0.4 + (k % 3) * 3;
      if (x > 4 && x < 90) owl(p, Math.round(x), Math.round(y), f % 2 === 0);
    }
  if (mood === 'trouble') smoke(p, f, 60, 20);
  marks(p, f, mood, 58, 14, X.candle);
};

const potioneer: PixelScene = (p, f, mood) => {
  hall(p, f, mood);
  p.rect(64, 14, 28, 2, X.woodD);
  [X.code1, X.code2, X.r, X.crystal].forEach((c, i) => {
    p.rect(66 + i * 6, 8, 3, 6, c);
    p.set(67 + i * 6, 7, X.woodD);
  });
  const look: Look = {
    skin: X.s,
    hair: X.k,
    hairStyle: 'long',
    robe: X.robeBlue,
    robeDark: X.k,
  };
  const hands = pose(28, 50, mood, f, [
    [14, 4],
    [16, 2],
    [15, 0],
    [13, 3],
  ]);
  if (mood !== 'idle')
    for (let i = 0; i < 5; i++)
      p.rect(52 + i * 4, 49, 2, 1 + ((f + i) % 2), (f + i) % 2 ? X.o : X.y);
  p.sprite(() => {
    p.ellipse(60, 44, 12, 8, X.k);
    p.rect(48, 36, 24, 2, X.iron);
    p.rect(50, 38, 20, 2, mood === 'trouble' ? X.code2 : X.code1);
    figure(p, f, mood, 28, 50, look, hands);
    if (mood === 'working') {
      p.line(hands.right[0] + 1, hands.right[1], 58 + (f % 4), 38, X.woodD);
    }
  }, X.k);
  if (mood !== 'idle')
    for (let k = 0; k < 5; k++) {
      const rise = (f + k * 4) % 16;
      p.set(52 + ((k * 7) % 16), 35 - rise, mood === 'trouble' ? X.code2 : X.code1);
    }
  if (mood === 'trouble') smoke(p, f, 60, 30);
  marks(p, f, mood, 36, 18, X.candle);
};

const courier: PixelScene = (p, f, mood) => {
  p.dither(0, 0, WIDTH, HEIGHT, X.sky, X.sky2, (_, j) => (j / HEIGHT) * 0.8);
  [
    [8, 6],
    [30, 12],
    [52, 4],
    [76, 10],
    [88, 3],
  ].forEach(([x, y], i) => {
    if ((f + i) % 9) p.set(x, y, X.moon);
  });
  p.ellipse(84, 12, 4, 4, X.moon);
  for (let x = 0; x < WIDTH; x++) {
    const h = 10 + ((x * 7) % 5) + (x > 40 && x < 56 ? 10 : 0) + (x > 44 && x < 52 ? 6 : 0);
    p.rect(x, HEIGHT - h, 1, h, X.k);
  }
  for (let i = 0; i < 4; i++) if ((f + i) % 3) p.set(46 + i * 2, HEIGHT - 20, X.yl);
  const flying = mood !== 'idle';
  const drift = mood === 'working' ? Math.round(Math.sin(f / 3) * 2) : 0;
  const x = flying ? 40 + (mood === 'working' ? Math.round(Math.sin(f / 7) * 6) : 0) : 30;
  const feet = flying ? 38 + drift : 54;
  const look: Look = {
    skin: X.s,
    hair: X.o,
    hairStyle: 'short',
    robe: X.crimson,
    robeDark: X.crimsonD,
    trim: X.gold,
  };
  const hands = pose(x, feet, mood, f, [[6, 9]]);
  p.sprite(() => {
    if (flying) {
      p.line(x - 12, feet + 1, x + 12, feet - 1, X.woodL, 2);
      p.line(x - 14, feet, x - 18, feet - 3 + (f % 2), X.gold);
      p.line(x - 14, feet + 2, x - 18, feet + 4 - (f % 2), X.gold);
    } else {
      p.line(14, 30, 18, 54, X.woodL, 2);
    }
    figure(p, f, mood, x, feet, look, hands);
    if (mood === 'working') {
      p.rect(x - 9, feet - 12 + (f % 2), 5, 2, X.gold);
      p.rect(x - 13, feet - 11 - (f % 2), 4, 2, X.crimson);
      p.rect(hands.right[0], hands.right[1] - 3, 5, 3, X.w);
    }
  }, X.k);
  marks(p, f, mood, x + 8, feet - 26, X.moon);
};

const stargazer: PixelScene = (p, f, mood) => {
  p.dither(0, 0, WIDTH, 50, X.stone, X.stoneD, (_, j) => 0.3 + (j / 50) * 0.3);
  for (let y = 0; y < 44; y++)
    for (let x = 54; x < 92; x++)
      if (y >= 18 || (x - 73) ** 2 + (y - 18) ** 2 <= 19 * 19)
        p.set(x, y, (x * 3 + y * 5) % 37 ? X.sky : X.moon);
  ground(p, 50, X.stoneD, X.stone, X.stoneL);
  const swirl = [X.code2, X.crystal, X.rose, X.code1];
  p.sprite(() => {
    p.rect(14, 40, 16, 2, X.woodD);
    p.rect(20, 42, 4, 8, X.woodD);
    p.ellipse(
      22,
      35,
      5,
      5,
      mood === 'trouble' ? X.r : swirl[mood === 'working' ? Math.floor(f / 2) % 4 : 1],
    );
    p.set(20, 33, X.w);
    const end: [number, number] =
      mood === 'working' ? [80, 22 + (Math.floor(f / 4) % 3)] : [76, 30];
    p.line(56, 40, end[0], end[1], X.gold, 3);
    p.line(58, 41, 54, 50, X.woodD);
    p.line(58, 41, 62, 50, X.woodD);
    const look: Look = {
      skin: X.s,
      hair: X.g,
      hairStyle: 'wild',
      beard: X.g,
      robe: X.robeBlue,
      robeDark: X.sky,
      trim: X.moon,
      hat: 'pointy',
      hatColor: X.robeBlue,
      hatTrim: X.moon,
    };
    const hands = pose(42, 50, mood, f, [
      [11, -2],
      [12, -3],
    ]);
    figure(p, f, mood, 42, 50, look, hands);
  }, X.k);
  if (mood === 'working') glow(p, 22, 35, 9, X.crystal, 0.4);
  marks(p, f, mood, 46, 14, X.moon);
};

const archivist: PixelScene = (p, f, mood) => {
  p.rect(0, 0, WIDTH, 50, X.woodD);
  const spines = [X.r, X.green, X.code3, X.amber, X.purple, X.crimson, X.olive];
  for (let shelf = 0; shelf < 4; shelf++) {
    const y = 3 + shelf * 12;
    p.rect(0, y + 10, WIDTH, 2, X.wood);
    for (let x = 2; x < WIDTH - 3; x += 3) {
      const h = 7 + ((x * 7 + shelf) % 3);
      p.rect(x, y + 10 - h, 2, h, spines[(x + shelf * 3) % spines.length]);
    }
  }
  ground(p, 50, X.wood, X.woodD, X.woodL);
  const look: Look = {
    skin: X.s,
    hair: X.g,
    hairStyle: 'bun',
    robe: X.olive,
    robeDark: X.scaleD,
    trim: X.gold,
  };
  const hands = pose(30, 50, mood, f, [
    [16, 0],
    [17, -1],
    [18, 0],
  ]);
  p.sprite(() => {
    p.rect(38, 40, 30, 3, X.wood);
    p.rect(40, 43, 3, 7, X.woodD);
    p.rect(62, 43, 3, 7, X.woodD);
    p.rect(44, 37, 18, 3, X.paper);
    const written = mood === 'working' ? f % 16 : 16;
    for (let i = 0; i < Math.min(written, 15); i++) if (i % 4 !== 3) p.set(45 + i, 38, X.ink);
    figure(p, f, mood, 30, 50, look, hands);
    p.set(28, 30, X.gold);
    p.set(31, 30, X.gold);
    if (mood === 'working')
      p.line(hands.right[0] + 1, hands.right[1], hands.right[0] + 4, hands.right[1] - 6, X.w);
  }, X.k);
  if (mood === 'working')
    for (let k = 0; k < 3; k++) {
      const t = (f + k * 7) % 21;
      const x = 70 + Math.round(Math.sin((t + k * 4) / 3) * 8);
      const y = 30 - t;
      if (y > 2) {
        p.rect(x, y, 4, 3, spines[k + 1]);
        p.set(x + (f % 2 ? -1 : 4), y + 1, X.w);
      }
    }
  if (mood === 'trouble')
    for (let k = 0; k < 4; k++) p.rect(46 + k * 8, 44 + ((f + k) % 6), 3, 2, X.w);
  marks(p, f, mood, 38, 16, X.candle);
};

const RUNES = [
  [1, 0, 1, 1, 0],
  [1, 1, 0, 1],
  [0, 1, 1, 0, 1, 1],
  [1, 0, 1],
  [1, 1, 1, 0, 1],
];

const scribe: PixelScene = (p, f, mood) => {
  hall(p, f, mood);
  const look: Look = {
    skin: X.s,
    hair: X.k,
    hairStyle: 'short',
    robe: X.robeBlue,
    robeDark: X.k,
    trim: X.code3,
    hat: 'hood',
    hatColor: X.robeBlue,
  };
  const hands = pose(26, 52, mood, f, [
    [16, -4],
    [17, -6],
  ]);
  p.sprite(() => {
    p.rect(52, 40, 4, 12, X.woodD);
    p.rect(40, 34, 30, 8, X.paper);
    p.rect(54, 34, 1, 8, X.woodD);
    figure(p, f, mood, 26, 52, look, hands);
  }, X.k);
  const lines = mood === 'working' ? Math.floor(f / 3) % 6 : 5;
  RUNES.slice(0, lines).forEach((row, i) =>
    row.forEach((on, j) => {
      if (on)
        p.set((i < 3 ? 42 : 57) + j * 2, 36 + (i % 3) * 2, mood === 'trouble' ? X.r : X.code3);
    }),
  );
  if (mood === 'working') {
    const qx = 42 + (f % 12) * 2;
    p.line(qx, 32, qx + 4, 26, X.w);
    p.set(qx, 33, X.ink);
    glow(p, 55, 36, 12, X.code3, 0.25);
  }
  marks(p, f, mood, 34, 18, X.candle);
};

const warden: PixelScene = (p, f, mood) => {
  p.dither(0, 0, WIDTH, 52, X.stone, X.stoneD, (_, j) => 0.3 + (j / 52) * 0.3);
  for (let y = 0; y < 52; y++)
    for (let x = 50; x < 88; x++)
      if (y >= 22 || (x - 69) ** 2 + (y - 22) ** 2 <= 19 * 19)
        p.set(x, y, x % 6 === 0 ? X.woodD : X.wood);
  for (const y of [18, 34]) p.rect(50, y, 38, 2, X.iron);
  p.ellipse(80, 34, 2.5, 2.5, X.gold);
  ground(p, 52, X.stoneD, X.stone, X.stoneL);
  const look: Look = {
    skin: X.s,
    hair: X.b,
    hairStyle: 'wild',
    beard: X.b,
    robe: X.owl,
    robeDark: X.owlD,
    trim: X.woodD,
  };
  const hands = pose(28, 52, mood, f, [
    [10, -2],
    [10, 0],
  ]);
  if (mood !== 'trouble') glow(p, hands.left[0], hands.left[1] + 4, 9, X.yl, 0.3);
  p.sprite(() => {
    figure(p, f, mood, 28, 52, look, hands);
    const lantern = mood === 'trouble' ? (f % 4 < 2 ? X.r : X.rl) : X.y;
    p.rect(hands.left[0] - 2, hands.left[1] + 2, 4, 5, lantern);
    p.rect(hands.left[0] - 2, hands.left[1] + 1, 4, 1, X.iron);
    p.ellipse(hands.right[0] + 2, hands.right[1] + 3, 2, 2, X.gold);
  }, X.k);
  if (mood === 'working')
    for (let k = 0; k < 2; k++) {
      const x = 90 - ((f * 2 + k * 28) % 52);
      const y = 26 + k * 8;
      p.rect(x, y, 6, 4, X.paper);
      p.line(x, y, x + 3, y + 2, X.g);
      p.line(x + 5, y, x + 3, y + 2, X.g);
      if (x < 46) p.rect(x + 2, y + 2, 2, 2, X.crimson);
    }
  marks(p, f, mood, 36, 18, X.candle);
};

export const WIZARDING: Readonly<Record<string, PixelScene>> = {
  assistant: archmage,
  kitchen: potioneer,
  travel: courier,
  observation: stargazer,
  analysis: archivist,
  coding: scribe,
  security: warden,
};
