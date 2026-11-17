import type { AgentMood } from '../../../domain/agent-activity';
import { HEIGHT, PixelFrame, WIDTH } from '../pixel-frame';
import {
  X,
  figure,
  glow,
  marks,
  pose,
  smoke,
  sparkle,
  type Look,
  type PixelScene,
  type Point,
} from './kit';

function agora(p: PixelFrame, f: number, mood: AgentMood, columns = true): void {
  p.dither(0, 0, WIDTH, 30, X.aegeanL, X.w, (_, j) => (j / 30) * 0.8);
  p.ellipse(82, 9, 5, 5, X.sun);
  p.rect(0, 30, WIDTH, 8, X.aegean);
  for (let k = 0; k < 8; k++) {
    const x = (k * 13 + (mood === 'idle' ? 0 : Math.floor(f / 2))) % WIDTH;
    p.rect(x, 32 + (k % 3) * 2, 3, 1, X.aegeanL);
  }
  p.rect(0, 38, WIDTH, 14, X.marble);
  p.rect(0, 38, WIDTH, 1, X.marbleD);
  p.dither(0, 52, WIDTH, HEIGHT - 52, X.marble, X.marbleD, (i, j) =>
    ((i >> 3) + (j >> 2)) % 2 ? 0.55 : 0.1,
  );
  p.rect(0, 52, WIDTH, 1, X.marbleD);
  if (!columns) return;
  for (const x of [2, 84]) {
    p.rect(x - 1, 2, 12, 3, X.marbleD);
    p.rect(x, 5, 10, 47, X.marble);
    for (let i = 1; i < 10; i += 3) p.rect(x + i, 6, 1, 45, X.marbleD);
    p.rect(x - 1, 50, 12, 2, X.marbleD);
  }
}

function chiton(robe = X.marble, trim = X.purple): Pick<Look, 'robe' | 'robeDark' | 'trim'> {
  return { robe, robeDark: X.marbleD, trim };
}

const oracle: PixelScene = (p, f, mood) => {
  agora(p, f, mood);
  const look: Look = { skin: X.s, hair: X.k, hairStyle: 'long', ...chiton(), hat: 'laurel' };
  const hands = pose(
    36,
    52,
    mood,
    f,
    [
      [12, -6],
      [13, -9],
      [11, -4],
    ],
    [
      [-8, -6],
      [-9, -9],
      [-7, -4],
    ],
  );
  p.sprite(() => {
    p.line(56, 40, 52, 52, X.bronzeD);
    p.line(60, 40, 60, 52, X.bronzeD);
    p.line(64, 40, 68, 52, X.bronzeD);
    p.ellipse(60, 39, 7, 2.5, X.bronze);
    figure(p, f, mood, 36, 52, look, hands);
  }, X.k);
  const colors = [X.purple, X.code2, X.w, X.crystal];
  if (mood !== 'idle')
    for (let k = 0; k < 8; k++) {
      const rise = (f + k * 3) % 22;
      const x = 60 + Math.round(Math.sin((rise + k) / 2.5) * (2 + rise / 5));
      p.ellipse(x, 36 - rise, 1.4 + rise / 10, 1.2, mood === 'trouble' ? X.smoke : colors[k % 4]);
    }
  if (mood === 'working') sparkle(p, f, 60, 16, X.gold);
  marks(p, f, mood, 44, 18);
};

const satyr: PixelScene = (p, f, mood) => {
  agora(p, f, mood);
  const look: Look = {
    skin: X.sd,
    hair: X.b,
    hairStyle: 'curls',
    beard: X.b,
    robe: X.olive,
    robeDark: X.owlD,
  };
  const flip = mood === 'working' && f % 6 < 3;
  const hands = pose(28, 52, mood, f, [
    [16, -2],
    [16, -6],
  ]);
  p.sprite(() => {
    p.rect(24, 50, 3, 2, X.owl);
    p.rect(30, 50, 3, 2, X.owl);
    figure(p, f, mood, 28, 52, look, hands);
    p.set(24, 26, X.marble);
    p.set(23, 25, X.marble);
    p.set(32, 26, X.marble);
    p.set(33, 25, X.marble);
    p.rect(46, 42, 20, 3, X.bronze);
    p.line(48, 45, 46, 52, X.bronzeD);
    p.line(64, 45, 66, 52, X.bronzeD);
    p.ellipse(56, flip ? 36 : 40, 5, 1.8, X.aegeanL);
    p.set(52, flip ? 36 : 40, X.k);
    p.ellipse(78, 44, 4, 7, X.copper);
    p.rect(76, 36, 4, 2, X.copper);
    p.rect(75, 44, 7, 1, X.k);
  }, X.k);
  if (mood !== 'idle')
    for (let i = 0; i < 6; i++)
      p.rect(48 + i * 3, 42 - ((f + i) % 2) - 1, 2, 1 + ((f + i) % 2), (f + i) % 2 ? X.o : X.y);
  if (mood === 'trouble') smoke(p, f, 56, 34);
  marks(p, f, mood, 36, 18);
};

const messenger: PixelScene = (p, f, mood) => {
  p.dither(0, 0, WIDTH, HEIGHT, X.aegeanL, X.w, (_, j) => (j / HEIGHT) * 0.7);
  const drift = mood === 'working' ? f : 0;
  for (const [x0, y, w] of [
    [10, 50, 14],
    [60, 56, 18],
    [40, 12, 9],
    [84, 26, 10],
  ]) {
    const x = ((((x0 - drift * 2) % 120) + 120) % 120) - 12;
    p.ellipse(x, y, w, 3.5, X.w);
    p.ellipse(x + 3, y - 2, w * 0.6, 3, X.w);
  }
  const hover = mood === 'idle' ? 0 : Math.round(Math.sin(f / 3) * 2);
  const feet = mood === 'idle' ? 54 : 44 + hover;
  const x = 46;
  const look: Look = {
    skin: X.s,
    hair: X.y,
    hairStyle: 'curls',
    ...chiton(X.w, X.gold),
    hat: 'cap',
    hatColor: X.gilt,
  };
  const hands = pose(
    x,
    feet,
    mood,
    f,
    [
      [9, -4],
      [10, -5],
    ],
    [[-9, 2]],
  );
  p.sprite(() => {
    if (mood === 'idle') p.ellipse(x, 56, 14, 3, X.w);
    figure(p, f, mood, x, feet, look, hands);
    const up = f % 2 === 0 || mood === 'idle';
    for (const fx of [x - 4, x + 3]) {
      p.rect(fx - 1, feet, 3, 1, X.gilt);
      p.set(fx - 2, feet - (up ? 2 : 0), X.w);
      p.set(fx - 3, feet - (up ? 3 : -1), X.w);
    }
    p.rect(hands.right[0], hands.right[1] - 3, 3, 5, X.paper);
  }, X.k);
  if (mood === 'working')
    for (let k = 0; k < 3; k++) p.rect(x - 22 - k * 3, feet - 10 + k * 4, 6, 1, X.w);
  marks(p, f, mood, x + 8, feet - 28);
};

const centaur: PixelScene = (p, f, mood) => {
  agora(p, f, mood, false);
  for (let x = 60; x < WIDTH; x += 9) {
    p.ellipse(x + 4, 30, 5, 7, X.laurel);
    p.rect(x + 3, 34, 2, 4, X.owlD);
  }
  const walk = mood === 'working' ? Math.floor(f / 2) % 2 : 0;
  const x = 40;
  const look: Look = {
    skin: X.sd,
    hair: X.b,
    hairStyle: 'curls',
    beard: X.b,
    robe: X.olive,
    robeDark: X.scaleD,
  };
  const hands = pose(
    x - 2,
    42,
    mood,
    f,
    [
      [8, -4],
      [9, -4],
    ],
    [[-10, -4]],
  );
  p.sprite(() => {
    p.ellipse(x + 8, 44, 11, 5.5, X.owl);
    for (const [lx, phase] of [
      [x + 1, 0],
      [x + 5, 1],
      [x + 12, 0],
      [x + 16, 1],
    ]) {
      p.rect(lx, 47, 2, 5 - ((walk + phase) % 2), X.owl);
      p.rect(lx, 52 - ((walk + phase) % 2) - 1, 2, 1, X.owlD);
    }
    p.line(x + 19, 42, x + 23, 48 + walk, X.b, 2);
    figure(p, f, mood, x - 2, 42, look, hands);
    const bx = hands.left[0] - 1;
    const by = hands.left[1];
    p.line(bx + 2, by - 9, bx - 1, by, X.woodD);
    p.line(bx - 1, by + 1, bx + 2, by + 9, X.woodD);
    p.line(bx + 2, by - 9, bx + 2, by + 9, X.w);
    if (mood === 'working') p.line(bx + 2, by, bx + 12, by, X.woodL);
  }, X.k);
  marks(p, f, mood, x + 6, 12);
};

const philosopher: PixelScene = (p, f, mood) => {
  agora(p, f, mood);
  const look: Look = {
    skin: X.s,
    hair: X.w,
    hairStyle: 'short',
    beard: X.w,
    ...chiton(X.marble, X.olive),
  };
  const hands = pose(28, 52, mood, f, [
    [18, 2],
    [20, 1],
  ]);
  p.sprite(() => {
    p.rect(42, 40, 34, 12, X.woodD);
    p.rect(44, 42, 30, 8, X.amber);
    figure(p, f, mood, 28, 52, look, hands);
  }, X.k);
  const progress = mood === 'working' ? (f % 40) / 40 : 1;
  const steps = Math.floor(progress * 40);
  for (let i = 0; i < steps; i++) {
    const a = (i / 40) * Math.PI * 2;
    p.set(Math.round(53 + Math.cos(a) * 6), Math.round(46 + Math.sin(a) * 3), X.owlD);
  }
  if (progress > 0.5) {
    p.line(60, 49, 70, 49, X.owlD);
    p.line(70, 49, 65, 43, X.owlD);
    p.line(65, 43, 60, 49, X.owlD);
  }
  if (mood === 'working') {
    const a = progress * Math.PI * 2;
    const tip: Point = [Math.round(53 + Math.cos(a) * 6), Math.round(46 + Math.sin(a) * 3)];
    p.line(53, 40, tip[0], tip[1], X.iron);
  }
  if (mood === 'trouble') for (let k = 0; k < 6; k++) p.set(48 + k * 4, 44 + ((f + k) % 5), X.w);
  marks(p, f, mood, 36, 18);
};

function gear(p: PixelFrame, cx: number, cy: number, r: number, turn: number): void {
  p.ellipse(cx, cy, r, r, X.bronze);
  for (let t = 0; t < 8; t++) {
    const a = ((t + turn / 2) / 8) * Math.PI * 2;
    p.rect(
      Math.round(cx + Math.cos(a) * (r + 1)),
      Math.round(cy + Math.sin(a) * (r + 1)),
      2,
      2,
      X.bronze,
    );
  }
  p.ellipse(cx, cy, r / 2.5, r / 2.5, X.bronzeD);
}

const tinker: PixelScene = (p, f, mood) => {
  agora(p, f, mood);
  const turn = mood === 'working' ? f : 0;
  gear(p, 70, 16, 5, turn);
  gear(p, 79, 22, 4, -turn);
  const look: Look = {
    skin: X.sd,
    hair: X.k,
    hairStyle: 'short',
    beard: X.k,
    robe: X.owlD,
    robeDark: X.k,
    trim: X.bronze,
  };
  const strike = mood === 'working' && f % 4 < 2;
  const hands = pose(26, 52, mood, f, [
    [12, -10],
    [14, -2],
  ]);
  p.sprite(() => {
    p.rect(50, 30, 14, 16, X.bronze);
    p.rect(52, 22, 10, 8, X.bronze);
    p.rect(54, 25, 2, 2, mood === 'idle' ? X.bronzeD : X.crystal);
    p.rect(58, 25, 2, 2, mood === 'idle' ? X.bronzeD : X.crystal);
    p.rect(52, 46, 3, 6, X.bronzeD);
    p.rect(59, 46, 3, 6, X.bronzeD);
    p.rect(47, 32, 3, 10, X.bronzeD);
    p.rect(64, 32 + (mood === 'working' ? f % 2 : 0), 3, 10, X.bronzeD);
    p.rect(54, 36, 6, 4, mood === 'trouble' ? X.r : X.ember);
    figure(p, f, mood, 26, 52, look, hands);
    if (mood === 'working') {
      const head: Point = strike ? [46, 36] : [hands.right[0] + 2, hands.right[1] - 4];
      p.line(hands.right[0], hands.right[1], head[0], head[1], X.woodD);
      p.rect(head[0] - 1, head[1] - 2, 3, 3, X.iron);
    }
  }, X.k);
  if (strike) for (let k = 0; k < 4; k++) p.set(45 + k * 2, 34 - (k % 2) * 2, X.y);
  if (mood === 'trouble') smoke(p, f, 57, 18);
  if (mood !== 'idle') glow(p, 57, 26, 6, X.crystal, 0.2);
  marks(p, f, mood, 34, 18);
};

const hoplite: PixelScene = (p, f, mood) => {
  agora(p, f, mood, false);
  p.rect(52, 6, 40, 4, X.marbleD);
  p.rect(56, 10, 32, 42, X.k);
  for (const x of [52, 84]) p.rect(x, 10, 6, 42, X.marble);
  const look: Look = {
    skin: X.sd,
    hair: X.b,
    hairStyle: 'short',
    robe: X.crimson,
    robeDark: X.crimsonD,
    trim: X.bronze,
    hat: 'helm',
    hatColor: X.bronze,
    hatTrim: X.crimson,
  };
  const guarding = mood === 'working' || mood === 'trouble';
  const hands = pose(30, 52, mood, f, [
    [9, 2],
    [9, 1],
  ]);
  p.sprite(() => {
    p.line(
      hands.right[0] + 1,
      hands.right[1] + 10,
      hands.right[0] + 1 + (guarding ? 2 : 0),
      14,
      X.woodD,
    );
    p.rect(hands.right[0] + (guarding ? 2 : 0), 11, 3, 4, X.bronze);
    figure(p, f, mood, 30, 52, look, hands);
    const sx = guarding ? 36 : 22;
    p.ellipse(sx, 42, 7, 7, X.bronze);
    p.ellipse(sx, 42, 5, 5, mood === 'trouble' && f % 4 < 2 ? X.r : X.crimson);
    p.rect(sx - 1, 39, 2, 6, X.bronze);
    p.rect(sx - 3, 41, 6, 2, X.bronze);
  }, X.k);
  marks(p, f, mood, 38, 16);
};

export const DEMIGOD: Readonly<Record<string, PixelScene>> = {
  assistant: oracle,
  kitchen: satyr,
  travel: messenger,
  observation: centaur,
  analysis: philosopher,
  coding: tinker,
  security: hoplite,
};
