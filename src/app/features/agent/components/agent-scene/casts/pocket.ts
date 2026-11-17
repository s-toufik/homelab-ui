import type { AgentMood } from '../../../domain/agent-activity';
import { HEIGHT, PixelFrame, WIDTH, type Color } from '../pixel-frame';
import { X, glow, marks, smoke, sparkle, type PixelScene } from './kit';

function route(p: PixelFrame, f: number, mood: AgentMood, night = false): void {
  p.dither(
    0,
    0,
    WIDTH,
    36,
    night ? X.sky : X.day,
    night ? X.sky2 : X.dayL,
    (_, j) => (j / 36) * 0.9,
  );
  if (night)
    [
      [10, 6],
      [26, 14],
      [44, 4],
      [70, 10],
      [86, 18],
    ].forEach(([x, y], i) => {
      if ((f + i) % 9) p.set(x, y, X.moon);
    });
  else {
    p.ellipse(80, 9, 5, 5, X.sun);
    p.ellipse(18, 10, 7, 2.5, X.w);
    p.ellipse(20, 8, 4, 2, X.w);
  }
  p.dither(
    0,
    36,
    WIDTH,
    HEIGHT - 36,
    night ? X.scaleD : X.grass,
    night ? X.scale : X.grassD,
    (i, j) => ((i * 5 + j * 3) % 11) / 22,
  );
  for (let x = -4; x < WIDTH; x += 11) {
    p.ellipse(x + 5, 32, 6, 8, night ? X.scaleD : X.grassD);
    p.rect(x + 4, 36, 2, 4, X.owlD);
  }
  p.dither(
    0,
    40,
    WIDTH,
    HEIGHT - 40,
    night ? X.scaleD : X.grass,
    night ? X.scale : X.grassD,
    (i, j) => ((i * 5 + j * 3) % 11) / 22,
  );
  p.rect(0, 50, WIDTH, 14, night ? X.cobbleD : X.path);
  p.dither(
    0,
    50,
    WIDTH,
    14,
    night ? X.cobbleD : X.path,
    night ? X.cobble : X.pathD,
    (i, j) => ((i * 3 + j * 7) % 13) / 30,
  );
  const sway = mood === 'working' ? f % 2 : 0;
  for (let x = 2; x < WIDTH; x += 9) {
    p.line(x, 50, x - 1 + sway, 45, night ? X.scale : X.grassL);
    p.line(x + 2, 50, x + 3 + sway, 46, night ? X.scale : X.grassL);
  }
}

function eyes(p: PixelFrame, f: number, mood: AgentMood, x: number, y: number, gap: number): void {
  for (const ex of [x - gap, x + gap - 1]) {
    if (mood === 'idle' || (mood !== 'trouble' && f % 28 === 0)) {
      p.rect(ex - 1, y + 1, 3, 1, X.k);
    } else if (mood === 'trouble') {
      p.set(ex - 1, y, X.k);
      p.set(ex + 1, y, X.k);
      p.set(ex, y + 1, X.k);
      p.set(ex - 1, y + 2, X.k);
      p.set(ex + 1, y + 2, X.k);
    } else {
      p.rect(ex - 1, y, 2, 3, X.k);
      p.set(ex - 1, y, X.w);
    }
  }
}

function cheeks(p: PixelFrame, x: number, y: number, gap: number, color: Color = X.pink): void {
  p.rect(x - gap - 3, y, 2, 1, color);
  p.rect(x + gap + 1, y, 2, 1, color);
}

function note(p: PixelFrame, x: number, y: number, color: Color): void {
  p.rect(x, y, 1, 4, color);
  p.rect(x - 1, y + 3, 2, 2, color);
  p.rect(x + 1, y, 2, 1, color);
}

const chorumble: PixelScene = (p, f, mood) => {
  route(p, f, mood);
  const hover = mood === 'idle' ? 6 : Math.round(Math.sin(f / 2) * 2);
  const x = 48;
  const y = 30 + hover;
  p.sprite(() => {
    const up = mood !== 'idle' && f % 2 === 0;
    p.ellipse(x - 5, y - 8 - (up ? 2 : 0), 5, 3, X.w);
    p.ellipse(x + 5, y - 8 - (up ? 2 : 0), 5, 3, X.w);
    p.ellipse(x, y, 10, 8, X.star);
    for (const sx of [-4, 1, 6]) p.rect(x + sx, y - 7, 2, 15, X.k);
    p.ellipse(x - 1, y - 1, 5, 4, X.star);
    p.set(x - 3, y - 13, X.k);
    p.set(x + 3, y - 13, X.k);
    p.line(x - 2, y - 8, x - 3, y - 12, X.k);
    p.line(x + 2, y - 8, x + 3, y - 12, X.k);
    const baton =
      mood === 'working'
        ? [
            [x + 16, y - 8],
            [x + 17, y - 2],
            [x + 13, y - 10],
          ][Math.floor(f / 2) % 3]
        : [x + 14, y + 2];
    p.line(x + 9, y, baton[0], baton[1], X.w);
    p.ellipse(x + 9, y + 1, 1.6, 1.6, X.starD);
  }, X.k);
  eyes(p, f, mood, x - 1, y - 2, 3);
  cheeks(p, x - 1, y + 2, 3);
  if (mood === 'working')
    for (let k = 0; k < 5; k++) {
      const t = (f + k * 5) % 20;
      const dir = k % 2 ? 1 : -1;
      note(
        p,
        Math.round(x + dir * (14 + t * 1.6)),
        Math.round(y - 6 - t * 0.6 + (k % 3) * 4),
        [X.r, X.code3, X.code2, X.green, X.o][k],
      );
    }
  marks(p, f, mood, x + 10, y - 22);
};

const simmercrab: PixelScene = (p, f, mood) => {
  route(p, f, mood);
  const x = 48;
  const y = 44;
  const busy = mood === 'working';
  const walk = busy ? (f % 4 < 2 ? 1 : 0) : 0;
  p.sprite(() => {
    for (const lx of [-9, -5, 4, 8])
      p.line(x + lx, y + 3, x + lx + (lx < 0 ? -3 : 3), y + 8 - walk, X.salD);
    p.ellipse(x, y, 11, 6, X.sal);
    p.rect(x - 9, y - 8, 18, 6, X.iron);
    p.rect(x - 10, y - 9, 20, 2, X.ironL);
    p.rect(x - 8, y - 7, 16, 1, mood === 'trouble' ? X.code2 : X.amber);
    const claw = busy ? Math.floor(f / 2) % 2 : 0;
    p.ellipse(x - 15, y - 3 - claw * 3, 3.5, 3, X.sal);
    p.ellipse(x + 15, y - 3 - (1 - claw) * 3, 3.5, 3, X.sal);
    p.set(x - 15, y - 6 - claw * 3, X.k);
    p.set(x + 15, y - 6 - (1 - claw) * 3, X.k);
    p.line(x - 9, y - 1, x - 13, y - 2, X.sal, 2);
    p.line(x + 9, y - 1, x + 13, y - 2, X.sal, 2);
    if (busy) p.line(x + 15, y - 6 - (1 - claw) * 3, x + 5, y - 12, X.woodD);
    p.rect(x - 4, y - 14, 1, 4, X.salD);
    p.rect(x + 3, y - 14, 1, 4, X.salD);
  }, X.k);
  eyes(p, f, mood, x, y - 16, 4);
  cheeks(p, x, y + 1, 3, X.salD);
  if (mood !== 'idle') {
    for (let s = 0; s < 3; s++)
      for (let k = 0; k < 4; k++) {
        const yy = y - 12 - ((f + s * 4 + k * 3) % 12);
        p.set(x - 6 + s * 6 + Math.round(Math.sin(yy / 2)), yy, k % 2 ? X.w : X.g);
      }
    for (let i = 0; i < 4; i++) p.set(x - 6 + i * 4, y + 6, (f + i) % 2 ? X.o : X.y);
  }
  if (mood === 'trouble') smoke(p, f, x, y - 14);
  marks(p, f, mood, x + 10, y - 30);
};

const kitekin: PixelScene = (p, f, mood) => {
  route(p, f, mood);
  const resting = mood === 'idle';
  const x = resting ? 48 : 50 + (mood === 'working' ? Math.round(Math.sin(f / 5) * 10) : 0);
  const y = resting ? 46 : 22 + (mood === 'working' ? Math.round(Math.cos(f / 4) * 3) : 0);
  p.sprite(() => {
    const ribbon = resting ? 0 : f % 4;
    for (let k = 0; k < 6; k++) {
      const tx = x - 4 - k * 3;
      const ty = y + 10 + Math.round(Math.sin((k + ribbon) / 1.5) * 2) + (resting ? -8 : 0);
      p.rect(tx, ty, 2, 2, [X.r, X.y, X.code3][k % 3]);
    }
    for (let j = 0; j < 20; j++) {
      const w = j < 10 ? j : 20 - j;
      p.rect(x - w, y - 10 + j, w * 2 + 1, 1, j < 10 ? X.code3 : X.crystal);
    }
    p.rect(x, y - 10, 1, 20, X.w);
    p.rect(x - 9, y, 19, 1, X.w);
  }, X.k);
  eyes(p, f, mood, x, y - 3, 3);
  cheeks(p, x, y + 2, 3);
  if (mood === 'working')
    for (let k = 0; k < 3; k++) p.rect(x - 24 - ((f * 3 + k * 9) % 18), y - 6 + k * 5, 6, 1, X.w);
  marks(p, f, mood, x + 10, y - 18);
};

const lumoth: PixelScene = (p, f, mood) => {
  route(p, f, mood, true);
  const x = 48;
  const y = 28 + (mood === 'working' ? Math.round(Math.sin(f / 2)) : 4);
  const lit = mood === 'idle' ? 0.15 : mood === 'trouble' ? 0.5 : 0.35;
  glow(p, x - 10, y, 12, mood === 'trouble' ? X.r : X.yl, lit);
  glow(p, x + 10, y, 12, mood === 'trouble' ? X.r : X.yl, lit);
  if (mood === 'working') {
    const sweep = Math.sin(f / 5) * 18;
    for (let k = 0; k < 14; k++) p.speckle(Math.round(x + sweep * (k / 14)), y + 4 + k, X.yl, 0.9);
  }
  p.sprite(() => {
    const flap = mood !== 'idle' && f % 2 === 0 ? 1 : 0;
    p.ellipse(x - 10, y - 2 - flap, 9, 7, X.cloudD);
    p.ellipse(x + 10, y - 2 - flap, 9, 7, X.cloudD);
    p.ellipse(x - 8, y + 6, 6, 4, X.cloudD);
    p.ellipse(x + 8, y + 6, 6, 4, X.cloudD);
    const spot = mood === 'trouble' ? X.r : mood === 'idle' ? X.amber : X.yl;
    p.ellipse(x - 11, y - 3 - flap, 3.5, 3.5, spot);
    p.ellipse(x + 11, y - 3 - flap, 3.5, 3.5, spot);
    p.ellipse(x, y + 1, 4, 9, X.purple);
    p.ellipse(x, y - 7, 5, 4, X.code2);
    p.line(x - 2, y - 10, x - 6, y - 16, X.k);
    p.line(x + 2, y - 10, x + 6, y - 16, X.k);
    p.set(x - 7, y - 17, spot);
    p.set(x + 7, y - 17, spot);
  }, X.k);
  eyes(p, f, mood, x, y - 8, 2);
  marks(p, f, mood, x + 12, y - 22, X.moon);
};

const sproutgraph: PixelScene = (p, f, mood) => {
  route(p, f, mood);
  const x = 48;
  const y = 50;
  const heights = [6, 11, 8, 15];
  const progress = mood === 'working' ? (f % 32) / 20 : mood === 'trouble' ? 0.4 : 1;
  p.sprite(() => {
    heights.forEach((h, i) => {
      const shown = Math.max(1, Math.min(h, Math.round(progress * h)));
      const lx = x - 7 + i * 5;
      p.rect(lx, y - 14 - shown, 3, shown, mood === 'trouble' && i === 3 ? X.amber : X.grassL);
      p.rect(lx + 1, y - 14 - shown, 1, shown, X.grassD);
    });
    p.rect(x - 10, y - 14, 21, 3, X.copperD);
    p.ellipse(x, y - 6, 10, 7, X.copper);
    p.rect(x - 8, y - 2, 17, 4, X.copper);
  }, X.k);
  eyes(p, f, mood, x, y - 8, 4);
  cheeks(p, x, y - 4, 4, X.salD);
  if (mood === 'working') sparkle(p, f, x + 10, y - 30, X.y);
  if (mood === 'trouble')
    for (let k = 0; k < 3; k++) p.rect(x - 14 + k * 12, y - 4 + ((f + k) % 4), 2, 1, X.grassD);
  marks(p, f, mood, x + 12, y - 36);
};

const circuitoad: PixelScene = (p, f, mood) => {
  route(p, f, mood);
  const x = 40;
  const y = 46;
  const busy = mood === 'working';
  p.sprite(() => {
    p.rect(56, 44, 26, 4, X.steelD);
    for (let k = 0; k < 6; k++)
      p.rect(58 + k * 4, 45, 3, 2, busy && Math.floor(f / 2) % 6 === k ? X.code1 : X.steelL);
    p.rect(60, 30, 18, 12, X.steelD);
    p.rect(62, 32, 14, 8, X.screen);
    p.ellipse(x, y, 13, 7, X.scale);
    p.ellipse(x, y - 8, 10, 6, X.scale);
    p.ellipse(x - 6, y - 14, 3.5, 3.5, X.scale);
    p.ellipse(x + 6, y - 14, 3.5, 3.5, X.scale);
    p.ellipse(x, y + 2, 8, 3, X.grassL);
    p.line(x - 10, y - 4, x - 4, y - 4, X.code1);
    p.line(x - 4, y - 4, x - 4, y, X.code1);
    p.set(x - 4, y + 1, X.y);
    p.line(x + 4, y - 6, x + 9, y - 6, X.code1);
    p.set(x + 10, y - 6, X.y);
    if (busy && f % 4 < 2) p.line(x + 8, y - 6, 58 + (Math.floor(f / 2) % 6) * 4, 45, X.pink, 1);
  }, X.k);
  if (mood === 'idle') {
    p.rect(62, 32, 14, 8, X.screen);
  } else {
    for (let i = 0; i < 4; i++)
      p.rect(
        63 + (i % 2) * 2,
        33 + i * 2,
        4 + ((i + (busy ? Math.floor(f / 2) : 0)) % 4) * 2,
        1,
        mood === 'trouble' ? X.r : [X.code1, X.code3, X.code2, X.code4][i],
      );
  }
  eyes(p, f, mood, x, y - 15, 6);
  p.rect(x - 3, y - 6, 6, 1, X.scaleD);
  if (mood === 'trouble') {
    sparkle(p, f, 58, 30, X.spark);
    sparkle(p, f + 3, 80, 34, X.spark);
  }
  marks(p, f, mood, x + 10, y - 30);
};

const bastionail: PixelScene = (p, f, mood) => {
  route(p, f, mood);
  const hiding = mood === 'trouble';
  const x = mood === 'working' ? 40 + Math.round(Math.sin(f / 6) * 8) : 44;
  const y = 50;
  p.sprite(() => {
    if (!hiding) {
      p.ellipse(x - 2, y - 2, 16, 3, X.armadillo);
      p.ellipse(x - 14, y - 9, 4, 6, X.armadillo);
      p.line(x - 15, y - 14, x - 17, y - 19, X.armadilloD);
      p.line(x - 12, y - 14, x - 11, y - 19, X.armadilloD);
      p.rect(x - 18, y - 21, 2, 2, X.armadilloD);
      p.rect(x - 12, y - 21, 2, 2, X.armadilloD);
    }
    p.rect(x - 4, y - 22, 16, 20, X.stone);
    for (let cx = x - 4; cx < x + 12; cx += 4) p.rect(cx, y - 25, 2, 3, X.stone);
    for (let row = y - 18; row < y - 2; row += 4) p.rect(x - 4, row, 16, 1, X.stoneD);
    p.rect(x + 2, y - 10, 5, 8, hiding ? X.woodD : X.k);
    p.rect(x + 3, y - 32, 1, 7, X.woodD);
    p.rect(x + 4, y - 32, 5, 3, hiding ? (f % 4 < 2 ? X.r : X.rl) : X.code1);
  }, X.k);
  if (!hiding) eyes(p, f, mood, x - 14, y - 11, 2);
  if (mood === 'working')
    for (let k = 0; k < 2; k++) {
      const lx = 92 - ((f * 2 + k * 26) % 40);
      p.rect(lx, 34 + k * 6, 5, 3, X.w);
      p.set(lx + 2, 35 + k * 6, X.r);
    }
  marks(p, f, mood, x + 14, y - 40);
};

export const POCKET: Readonly<Record<string, PixelScene>> = {
  assistant: chorumble,
  kitchen: simmercrab,
  travel: kitekin,
  observation: lumoth,
  analysis: sproutgraph,
  coding: circuitoad,
  security: bastionail,
};
