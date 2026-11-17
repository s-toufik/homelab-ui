import type { AgentMood } from '../../domain/agent-activity';
import { HEIGHT, PixelFrame, WIDTH, palette } from './pixel-frame';

export type PixelScene = (p: PixelFrame, frame: number, mood: AgentMood) => void;

const X = palette({
  k: '#1a1423',
  w: '#f4efe6',
  g: '#b9b2a8',
  gd: '#8f887f',
  s: '#f2c4a0',
  sd: '#d99a78',
  b: '#5a3a22',
  r: '#c8473f',
  rl: '#ee6a5f',
  y: '#f6c453',
  yl: '#ffe08a',
  o: '#e0782f',
  pink: '#e8908a',
  wood: '#8a5a34',
  woodL: '#b07a4a',
  woodD: '#5e3b22',
  plank: '#9b663c',
  tile: '#e3d7bf',
  tileD: '#cdbe9f',
  steel: '#8c97a3',
  steelL: '#b7c0c9',
  steelD: '#5c6670',
  green: '#5fa35a',
  greenL: '#7bd88f',
  sky: '#1d2b53',
  sky2: '#3b3f8a',
  moon: '#fff1c1',
  stone: '#626a80',
  stoneD: '#4e5568',
  stoneL: '#9aa0b4',
  owl: '#7a5233',
  owlD: '#563a24',
  belly: '#d8b98c',
  eye: '#ffd23f',
  beak: '#e8892b',
  gold: '#d4a84b',
  paper: '#efe4c8',
  ink: '#4a3b2a',
  water: '#7fc8f8',
  smoke: '#4a4550',
  smokeL: '#6d6873',
  day: '#7ec8e3',
  dayL: '#bde6f1',
  sun: '#ffe27a',
  hill: '#7fb77e',
  hillD: '#5f9a63',
  path: '#c9a66b',
  pathD: '#b38f55',
  jacket: '#e07a3f',
  pants: '#3c4a6b',
  hat: '#d9b26a',
  hatD: '#b8913f',
  wall: '#d9d2c0',
  wallD: '#c9c0a8',
  board: '#2f4f3a',
  boardD: '#284433',
  chalk: '#f1f1e6',
  shell: '#5e8a4a',
  shellD: '#4a6e3a',
  turtle: '#9cc07a',
  lamp: '#3f7a4a',
  night: '#1e2233',
  nightD: '#252a3e',
  screen: '#0e1420',
  code1: '#7bd88f',
  code2: '#c79bff',
  code3: '#58a6ff',
  code4: '#f0b44c',
  hoodie: '#4b5a8c',
  hoodieD: '#3a4670',
  cat: '#9aa5b1',
  catD: '#76818d',
  castle: '#7d8494',
  castleD: '#6a7180',
  gate: '#2a2420',
  bars: '#4a4038',
  cobble: '#8a7a5a',
  cobbleD: '#76684b',
  dog: '#c8a27a',
  dogL: '#d9b58a',
  dogD: '#8a6a4a',
  curtain: '#8e2a2a',
  curtainD: '#6e1e1e',
  stage: '#2b2340',
  stageD: '#231c35',
  tails: '#22223a',
  hair: '#e6e1d8',
  indigo: '#8c9eff',
  teal: '#4fc1b0',
  amber: '#f0b44c',
  rose: '#ef6f9a',
});

function marks(p: PixelFrame, f: number, mood: AgentMood, x: number, y: number, ink = X.k): void {
  if (mood === 'idle') {
    const rise = f % 16;
    if (rise < 12) p.letterZ(x, y - Math.floor(rise / 2), ink);
    if (rise > 5) p.letterZ(x + 5, y - 6 - Math.floor((rise - 6) / 2), ink);
  } else if (mood === 'waiting') {
    p.bubble(x, y - 4, '?', X.k, X.w);
  } else if (mood === 'trouble' && f % 8 < 6) {
    p.bubble(x, y - 4, '!', X.r, X.w);
  }
}

function smoke(p: PixelFrame, f: number, x: number, y: number): void {
  for (let k = 0; k < 9; k++) {
    const rise = (f + k * 3) % 18;
    const cx = x + ((k * 5) % 9) - 4 + Math.round(Math.sin((rise + k) * 0.5) * 1.5);
    const cy = y - rise;
    p.ellipse(cx, cy, 1.6 + rise / 9, 1.4 + rise / 10, k % 2 ? X.smoke : X.smokeL);
  }
}

const kitchen: PixelScene = (p, f, mood) => {
  const on = mood === 'working';
  const trouble = mood === 'trouble';
  p.dither(0, 0, WIDTH, 48, X.tile, X.tileD, (_, j) => 0.15 + (j / 48) * 0.5);
  for (let x = 0; x < WIDTH; x += 12) p.rect(x, 0, 1, 48, X.tileD);
  for (let y = 9; y < 48; y += 10) p.rect(0, y, WIDTH, 1, X.tileD);
  p.rect(4, 15, 30, 2, X.wood);
  p.rect(4, 17, 30, 1, X.woodD);
  p.rect(56, 45, 34, 3, X.steelD);
  p.set(59, 46, X.k);
  p.set(86, 46, X.k);
  if (on || trouble)
    for (let i = 0; i < 6; i++) {
      const h = 1 + ((f + i) % 2);
      p.rect(61 + i * 4, 45 - h, 2, h, (f + i) % 2 ? X.y : X.o);
    }
  else for (let i = 0; i < 6; i++) p.set(62 + i * 4, 44, X.code3);
  p.sprite(() => {
    p.rect(6, 8, 5, 7, X.r);
    p.rect(6, 7, 5, 1, X.woodD);
    p.set(7, 9, X.w);
    p.rect(13, 6, 6, 9, X.green);
    p.rect(13, 5, 6, 1, X.woodD);
    p.set(14, 8, X.w);
    p.rect(21, 9, 5, 6, X.y);
    p.rect(21, 8, 5, 1, X.woodD);
    p.rect(62, 3, 30, 1, X.steelD);
    p.rect(66, 4, 1, 6, X.steel);
    p.ellipse(66.5, 11.5, 2.2, 2.2, X.steel);
    p.rect(74, 4, 1, 6, X.steel);
    p.rect(73, 10, 3, 4, X.steel);
    p.rect(82, 4, 1, 5, X.steel);
    p.ellipse(82.5, 11.5, 1.8, 3, X.steelL);
    p.rect(60, 32, 24, 10, X.steel);
    p.rect(60, 41, 24, 1, X.steelD);
    p.rect(58, 31, 28, 2, X.steelL);
    p.rect(56, 34, 2, 1, X.steelD);
    p.rect(86, 34, 2, 1, X.steelD);
    p.rect(62, 34, 1, 6, X.steelL);
    if (trouble) for (let i = 0; i < 5; i++) p.rect(61 + i * 5, 33, 2, 2 + ((f + i) % 3) * 2, X.o);
    p.rect(28, 40, 21, 10, X.w);
    p.ellipse(38, 50, 11, 12, X.w);
    p.ellipse(28, 44, 3, 4, X.w);
    p.rect(34, 38, 9, 2, X.r);
    for (const [x, y] of [
      [35, 42],
      [35, 45],
      [41, 42],
      [41, 45],
    ])
      p.set(x, y, X.g);
    const hx = mood === 'idle' ? 1 : 0;
    const hy = mood === 'idle' ? 1 : on ? (f % 16 < 8 ? 0 : 1) : 0;
    p.ellipse(38 + hx, 31 + hy, 6, 6, X.s);
    p.set(31 + hx, 31 + hy, X.s);
    p.set(45 + hx, 31 + hy, X.s);
    p.ellipse(34 + hx, 20 + hy, 4, 4, X.w);
    p.ellipse(38 + hx, 17 + hy, 4.5, 4.5, X.w);
    p.ellipse(42 + hx, 20 + hy, 4, 4, X.w);
    p.rect(32 + hx, 22 + hy, 13, 4, X.w);
    p.rect(32 + hx, 25 + hy, 13, 1, X.g);
    if (trouble) {
      p.rect(35 + hx, 29 + hy, 2, 2, X.w);
      p.rect(40 + hx, 29 + hy, 2, 2, X.w);
      p.set(35 + hx, 30 + hy, X.k);
      p.set(41 + hx, 30 + hy, X.k);
    } else if (mood === 'idle' || f % 28 === 0) {
      p.rect(35 + hx, 30 + hy, 2, 1, X.k);
      p.rect(40 + hx, 30 + hy, 2, 1, X.k);
    } else {
      p.rect(35 + hx, 29 + hy, 1, 2, X.k);
      p.rect(41 + hx, 29 + hy, 1, 2, X.k);
    }
    p.rect(34 + hx, 27 + hy, 3, 1, X.b);
    p.rect(40 + hx, 27 + hy, 3, 1, X.b);
    p.set(34 + hx, 32 + hy, X.pink);
    p.set(42 + hx, 32 + hy, X.pink);
    p.rect(38 + hx, 31 + hy, 1, 2, X.sd);
    p.rect(34 + hx, 33 + hy, 9, 1, X.b);
    p.set(33 + hx, 32 + hy, X.b);
    p.set(43 + hx, 32 + hy, X.b);
    if (trouble) p.rect(37 + hx, 35 + hy, 3, 2, X.k);
    const stir: [number, number][] = [
      [55, 37],
      [57, 35],
      [56, 33],
      [53, 35],
    ];
    const hand: [number, number] = on
      ? stir[Math.floor(f / 2) % 4]
      : trouble
        ? [47, 26]
        : mood === 'waiting'
          ? [50, 40]
          : [48, 45];
    p.line(46, 39, hand[0], hand[1], X.w, 2);
    p.ellipse(hand[0] + 1, hand[1] + 1, 1.6, 1.6, X.s);
    if (on) {
      const end: [number, number] = [hand[0] + 11, 33 + (Math.floor(f / 2) % 2)];
      p.line(hand[0] + 2, hand[1], end[0], end[1], X.woodD);
      p.rect(end[0], end[1], 2, 1, X.woodL);
    } else if (mood === 'waiting') {
      p.line(hand[0] + 1, hand[1] - 1, hand[0] + 1, hand[1] - 8, X.woodD);
      p.rect(hand[0], hand[1] - 10, 2, 2, X.woodL);
    }
    if (on && f % 10 < 5) {
      p.set(46, 25, X.water);
      p.set(46, 26, X.water);
    }
  }, X.k);
  if (on) {
    for (let k = 0; k < 4; k++) p.set(64 + ((f * 3 + k * 5) % 16), 31 - ((f + k) % 2), X.amber);
    for (let s = 0; s < 3; s++)
      for (let k = 0; k < 6; k++) {
        const y = 29 - ((f + s * 5 + k * 3) % 20);
        if (y < 3) continue;
        const x = 65 + s * 7 + Math.round(Math.sin((y + s * 2) * 0.55) * 1.5);
        p.set(x, y, k % 2 ? X.w : X.g);
      }
  }
  if (trouble) smoke(p, f, 72, 26);
  p.rect(0, 48, WIDTH, 16, X.wood);
  p.rect(0, 48, WIDTH, 1, X.woodL);
  p.rect(0, 49, WIDTH, 1, X.plank);
  for (let x = 8; x < WIDTH; x += 16) p.rect(x, 50, 1, 14, X.woodD);
  p.sprite(() => {
    p.rect(6, 46, 16, 2, X.belly);
    p.ellipse(10, 44, 2.5, 2.5, X.r);
    p.ellipse(16, 44.5, 2, 2, X.r);
    p.set(10, 41, X.green);
    p.set(16, 42, X.green);
    p.set(9, 43, X.pink);
  }, X.k);
  marks(p, f, mood, 48, 18);
};

const observation: PixelScene = (p, f, mood) => {
  const on = mood === 'working';
  const trouble = mood === 'trouble';
  p.dither(0, 0, WIDTH, 50, X.stone, X.stoneD, (_, j) => 0.25 + (j / 50) * 0.35);
  for (let y = 5; y < 50; y += 6) {
    p.rect(0, y, WIDTH, 1, X.stoneD);
    const offset = (y / 6) % 2 ? 0 : 6;
    for (let x = offset; x < WIDTH; x += 12) p.rect(x, y - 5, 1, 5, X.stoneD);
  }
  const inside = (x: number, y: number) =>
    x >= 52 && x <= 90 && y <= 47 && (y >= 24 || (x - 71) ** 2 + (y - 24) ** 2 <= 19 * 19);
  for (let y = 4; y < 48; y++)
    for (let x = 51; x < 92; x++) {
      if (!inside(x, y)) {
        if (inside(x + 1, y) || inside(x - 1, y) || inside(x, y + 1) || inside(x, y - 1))
          p.set(x, y, X.stoneL);
        continue;
      }
      p.set(x, y, X.sky);
      p.speckle(x, y, X.sky2, (y - 5) / 48);
    }
  [
    [58, 16],
    [64, 10],
    [84, 32],
    [60, 32],
    [74, 12],
    [88, 22],
    [67, 40],
  ].forEach(([x, y], i) => {
    if ((f + i * 3) % 11) p.set(x, y, X.moon);
  });
  p.ellipse(80, 15, 4, 4, X.moon);
  p.ellipse(78, 14, 3.4, 3.4, X.sky);
  p.rect(48, 48, 46, 2, X.stoneL);
  p.rect(48, 50, 48, 1, X.steelD);
  p.rect(48, 51, 48, 13, X.stoneD);
  p.rect(0, 50, 52, 14, X.wood);
  p.rect(0, 50, 52, 1, X.woodL);
  const lit = trouble ? 0.6 : on ? (f % 3 ? 0.55 : 0.7) : 0.3;
  for (let y = 0; y < 30; y++)
    for (let x = 0; x < 34; x++) {
      const d = Math.hypot(x - 14, y - 11) / 13;
      if (d < 1) p.speckle(x, y, trouble ? X.curtainD : X.ink, (1 - d) * lit);
    }
  p.rect(14, 0, 1, 6, X.k);
  p.sprite(() => {
    const flame = trouble ? (f % 4 < 2 ? X.r : X.rl) : on && f % 3 === 0 ? X.yl : X.y;
    p.rect(11, 6, 7, 1, X.woodD);
    p.rect(11, 7, 7, 7, flame);
    p.rect(13, 7, 1, 7, X.woodD);
    p.rect(16, 7, 1, 7, X.woodD);
    p.rect(10, 14, 9, 1, X.woodD);
    p.rect(4, 27, 26, 2, X.woodD);
    p.rect(7, 29, 20, 21, X.paper);
    const ends: [number, number][] = [
      [72, 35],
      [72, 36],
      [72, 37],
      [72, 36],
    ];
    const end = on ? ends[Math.floor(f / 4) % 4] : [69, 40];
    p.line(58, 44, end[0], end[1], X.gold, 2);
    p.set(end[0] + 1, end[1], X.moon);
    p.line(61, 45, 58, 47, X.woodD);
    p.line(61, 45, 64, 47, X.woodD);
    const hx = on ? [0, -1, -1, 0, 1, 1][Math.floor(f / 6) % 6] : 0;
    p.ellipse(40, 42, 7, 8, X.owl);
    p.ellipse(40, 44, 4, 5, X.belly);
    for (const [x, y] of [
      [38, 42],
      [41, 42],
      [39, 45],
      [42, 45],
      [38, 48],
      [41, 48],
    ])
      p.set(x, y, X.owl);
    p.ellipse(33, 43, 2, 5, X.owlD);
    p.ellipse(47, 43, 2, 5, X.owlD);
    if (trouble)
      for (const [x, y] of [
        [31, 37],
        [49, 37],
        [32, 49],
        [48, 49],
        [34, 25],
        [46, 25],
      ])
        p.set(x + (f % 2), y, X.owlD);
    p.rect(36, 50, 2, 1, X.beak);
    p.rect(42, 50, 2, 1, X.beak);
    p.ellipse(40 + hx, 31, 7, 6, X.owl);
    p.set(34 + hx, 25, X.owlD);
    p.set(35 + hx, 26, X.owlD);
    p.set(46 + hx, 25, X.owlD);
    p.set(45 + hx, 26, X.owlD);
    p.ellipse(37 + hx, 31, 3, 3, X.belly);
    p.ellipse(43 + hx, 31, 3, 3, X.belly);
    const awake = mood !== 'idle' && (trouble || f % 26 !== 0);
    if (awake) {
      const size = trouble ? 3 : 2;
      p.rect(36 + hx, 30, size, size, X.eye);
      p.rect(42 + hx, 30, size, size, X.eye);
      const look = on ? Math.floor(f / 3) % 2 : 0;
      p.set(36 + hx + look, 31, X.k);
      p.set(42 + hx + look, 31, X.k);
    } else {
      p.rect(36 + hx, 31, 2, 1, X.owlD);
      p.rect(42 + hx, 31, 2, 1, X.owlD);
    }
    p.set(40 + hx, 33, X.beak);
    p.set(40 + hx, 34, X.beak);
    p.set(45 + hx, 30, X.gold);
    p.set(45 + hx, 32, X.gold);
    p.set(46 + hx, 33, X.gold);
    p.set(46 + hx, 34, X.gold);
  }, X.k);
  const scroll = on ? Math.floor(f / 2) % 3 : 0;
  const base = on ? Math.floor(f / 6) : 0;
  const lengths = [12, 8, 15, 6, 11, 14, 9, 13];
  for (let i = 0; i < 7; i++) {
    const y = 31 + i * 3 - scroll;
    if (y < 30 || y > 48) continue;
    p.rect(9, y, lengths[(i + base) % 8], 1, trouble && i % 3 === 1 ? X.r : X.ink);
  }
  marks(p, f, mood, 50, 20, X.moon);
};

const travel: PixelScene = (p, f, mood) => {
  const on = mood === 'working';
  const trouble = mood === 'trouble';
  p.dither(0, 0, WIDTH, 48, X.day, X.dayL, (_, j) => (j / 48) * 0.9);
  p.ellipse(80, 11, 5, 5, X.sun);
  if (f % 4 < 2)
    for (const [x, y] of [
      [80, 3],
      [88, 11],
      [72, 11],
      [86, 5],
      [74, 5],
    ])
      p.set(x, y, X.sun);
  const drift = on ? Math.floor(f / 3) : 0;
  for (const [x0, y, w] of [
    [6, 9, 7],
    [46, 5, 9],
    [70, 22, 6],
  ]) {
    const x = ((x0 + drift) % 112) - 8;
    p.ellipse(x, y, w, 2.2, X.w);
    p.ellipse(x + 2, y - 1.5, w * 0.55, 2, X.w);
  }
  p.ellipse(18, 52, 40, 14, X.hill);
  p.ellipse(78, 54, 34, 12, X.hillD);
  p.dither(0, 48, WIDTH, 16, X.path, X.pathD, (i, j) => 0.2 + ((i + j * 3) % 7) / 20);
  p.sprite(() => {
    p.rect(84, 32, 2, 17, X.woodD);
    p.rect(77, 32, 11, 3, X.woodL);
    p.set(76, 33, X.woodL);
    p.rect(82, 37, 11, 3, X.woodL);
    p.set(93, 38, X.woodL);
    const sit = mood === 'idle' ? 2 : 0;
    p.rect(37, 47 - sit, 2, 4, X.pants);
    p.rect(41, 47 - sit, 2, 4, X.pants);
    p.rect(36, 51 - sit, 3, 1, X.woodD);
    p.rect(41, 51 - sit, 3, 1, X.woodD);
    p.rect(28, 31 + sit, 9, 15, X.owl);
    p.rect(28, 31 + sit, 9, 3, X.woodD);
    p.ellipse(32.5, 29 + sit, 5, 2, X.r);
    p.rect(35, 37 + sit, 10, 10 - sit, X.jacket);
    p.rect(39, 37 + sit, 1, 10 - sit, X.woodD);
    p.ellipse(40, 32 + sit, 4.5, 4.5, X.s);
    p.rect(35, 27 + sit, 10, 2, X.hat);
    p.rect(33, 29 + sit, 14, 1, X.hatD);
    if (mood === 'idle') {
      p.rect(37, 31 + sit, 6, 2, X.hat);
      p.rect(36, 30 + sit, 8, 1, X.hatD);
    } else if (trouble) {
      p.rect(38, 32, 1, 2, X.k);
      p.rect(42, 32, 1, 2, X.k);
      p.rect(39, 35, 3, 1, X.k);
      p.set(44, 30, X.water);
    } else if (f % 30 === 0) {
      p.rect(38, 33, 2, 1, X.k);
      p.rect(41, 33, 2, 1, X.k);
    } else {
      p.set(38, 32, X.k);
      p.set(42, 32, X.k);
      p.rect(39, 35, 3, 1, X.sd);
    }
    if (mood === 'idle') return;
    const flap = on ? f % 4 : 0;
    const mapTop = trouble ? 40 : 36;
    p.rect(44, mapTop, 12, 8, X.paper);
    if (flap === 1 || flap === 2) p.rect(54, mapTop - 1, 3, 2, X.paper);
    else p.rect(54, mapTop, 2, 1, X.belly);
    const route = trouble ? X.r : X.r;
    p.line(46, mapTop + 6, 49, mapTop + 3, route);
    p.line(49, mapTop + 3, 53, mapTop + 5, route);
    p.set(53, mapTop + 4, X.k);
    p.set(47, mapTop + 1, X.hillD);
    p.set(51, mapTop + 1, X.hillD);
    p.ellipse(44, mapTop + 4, 1.5, 1.5, X.s);
    if (on) {
      p.ellipse(60, 44, 3, 3, X.gold);
      p.ellipse(60, 44, 2, 2, X.w);
      const dirs: [number, number][] = [
        [0, -2],
        [1, -1],
        [2, 0],
        [1, 1],
        [0, 2],
        [-1, 1],
        [-2, 0],
        [-1, -1],
      ];
      const [dx, dy] = dirs[f % 8];
      p.line(60, 44, 60 + dx, 44 + dy, X.r);
    }
  }, X.k);
  if (on) {
    const x = ((f * 2) % 120) - 12;
    const y = 18 + Math.round(Math.sin(f / 4) * 2);
    p.rect(x, y, 5, 1, X.w);
    p.rect(x + 1, y + 1, 3, 1, X.g);
    p.set(x + 4, y - 1, X.w);
  }
  if (trouble) {
    p.rect(64, 49, 5, 1, X.w);
    p.rect(65, 48, 2, 1, X.g);
    p.set(69, 47, X.w);
  }
  marks(p, f, mood, 48, 20);
};

const analysis: PixelScene = (p, f, mood) => {
  const on = mood === 'working';
  const trouble = mood === 'trouble';
  p.dither(0, 0, WIDTH, 52, X.wall, X.wallD, (_, j) => 0.2 + (j / 52) * 0.4);
  p.rect(0, 52, WIDTH, 12, X.wood);
  p.rect(0, 52, WIDTH, 1, X.woodL);
  for (let x = 6; x < WIDTH; x += 14) p.rect(x, 53, 1, 11, X.woodD);
  p.rect(6, 5, 60, 36, X.woodD);
  p.rect(8, 7, 56, 32, X.board);
  p.dither(8, 7, 56, 32, X.board, X.boardD, () => 0.18);
  p.rect(8, 39, 56, 2, X.woodL);
  const heights = [8, 14, 10, 20, 16];
  const progress = on ? (f % 64) / 40 : 1;
  heights.forEach((h, i) => {
    const shown = Math.max(0, Math.min(h, Math.round((progress * 5 - i) * h)));
    p.rect(13 + i * 9, 36 - shown, 5, shown, X.chalk);
    if (shown > 2) p.rect(14 + i * 9, 37 - shown, 3, shown - 2, X.board);
  });
  p.rect(11, 36, 50, 1, X.chalk);
  p.rect(11, 10, 1, 27, X.chalk);
  const points: [number, number][] = [
    [15, 30],
    [24, 22],
    [33, 26],
    [42, 14],
    [51, 18],
    [59, 11],
  ];
  const drawn = on ? Math.floor((f % 64) / 10) : points.length - 1;
  for (let i = 0; i < Math.min(drawn, points.length - 1); i++)
    p.line(points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], X.amber);
  if (trouble)
    p.dither(30, 12, 24, 20, X.board, X.chalk, (i, j) => 0.6 - Math.hypot(i - 12, j - 10) / 20);
  if (mood === 'idle') {
    for (let y = 18; y < 52; y++)
      for (let x = 70; x < 96; x++) {
        const d = Math.hypot(x - 88, y - 26) / 20;
        if (d < 1) p.speckle(x, y, X.yl, (1 - d) * 0.35);
      }
  }
  p.sprite(() => {
    if (mood === 'idle') {
      p.rect(86, 24, 1, 22, X.k);
      p.ellipse(88, 22, 5, 3, X.lamp);
      p.rect(84, 46, 8, 2, X.k);
    }
    p.ellipse(78, 44, 11, 8, X.shell);
    for (const [x, y] of [
      [74, 40],
      [79, 38],
      [84, 41],
      [76, 45],
      [81, 44],
    ]) {
      p.rect(x, y, 3, 2, X.shellD);
    }
    p.rect(67, 50, 22, 2, X.shellD);
    p.rect(70, 51, 3, 2, X.turtle);
    p.rect(84, 51, 3, 2, X.turtle);
    const nod = on && f % 12 < 6 ? 1 : 0;
    p.rect(66, 38 + nod, 4, 4, X.turtle);
    p.ellipse(65, 35 + nod, 4.5, 4, X.turtle);
    p.rect(60, 31 + nod, 10, 1, X.k);
    p.rect(63, 30 + nod, 4, 1, X.k);
    p.set(68, 32 + nod, X.amber);
    p.set(68, 33 + nod, X.amber);
    if (trouble) {
      p.rect(62, 34, 2, 2, X.w);
      p.rect(66, 34, 2, 2, X.w);
    }
    p.rect(61, 34 + nod, 3, 2, X.k);
    p.rect(65, 34 + nod, 3, 2, X.k);
    p.set(64, 34 + nod, X.k);
    if (!trouble) {
      p.set(62, 35 + nod, X.w);
      p.set(66, 35 + nod, X.w);
    }
    p.rect(62, 37 + nod, 3, 1, X.shellD);
    if (on) {
      const reach: [number, number][] = [
        [58, 28],
        [56, 24],
        [58, 20],
        [55, 26],
      ];
      const [hx, hy] = reach[Math.floor(f / 3) % 4];
      p.line(70, 42, hx, hy, X.turtle, 2);
      p.rect(hx - 1, hy - 1, 2, 2, X.chalk);
    } else if (mood === 'idle') {
      p.rect(64, 40, 8, 6, X.r);
      p.rect(68, 40, 1, 6, X.rl);
      p.rect(65, 41, 2, 1, X.w);
    } else if (trouble) {
      p.line(70, 42, 60, 34, X.turtle, 2);
      p.set(58, 36 + (f % 4), X.chalk);
      p.set(60, 40 + (f % 4), X.chalk);
    } else {
      p.line(70, 42, 66, 46, X.turtle, 2);
    }
  }, X.k);
  if (on)
    for (let k = 0; k < 4; k++) p.set(54 + ((f + k * 3) % 7), 26 + ((f * 2 + k * 5) % 12), X.chalk);
  marks(p, f, mood, 72, 22);
};

const coding: PixelScene = (p, f, mood) => {
  const on = mood === 'working';
  const trouble = mood === 'trouble';
  p.dither(0, 0, WIDTH, 44, X.night, X.nightD, (_, j) => 0.3 + (j / 44) * 0.3);
  p.rect(6, 6, 14, 18, X.hoodieD);
  p.rect(8, 8, 10, 6, X.code3);
  p.rect(8, 16, 10, 2, X.code2);
  p.rect(8, 20, 6, 1, X.code1);
  p.rect(82, 10, 12, 1, X.woodD);
  for (let i = 0; i < 5; i++)
    p.rect(83 + i * 2, 5 + (i % 2), 2, 5 - (i % 2), [X.r, X.code3, X.amber, X.code1, X.code2][i]);
  p.rect(0, 44, WIDTH, 4, X.wood);
  p.rect(0, 44, WIDTH, 1, X.woodL);
  p.rect(0, 48, WIDTH, 16, X.stageD);
  p.rect(4, 48, 3, 16, X.woodD);
  p.rect(89, 48, 3, 16, X.woodD);
  p.sprite(() => {
    p.rect(46, 18, 32, 22, X.steelD);
    p.rect(59, 40, 6, 3, X.steelD);
    p.rect(55, 42, 14, 2, X.steelD);
    p.rect(44, 42, 4, 1, X.steelD);
    p.rect(78, 37, 6, 7, X.r);
    p.rect(84, 39, 1, 3, X.r);
    p.rect(79, 37, 4, 1, X.rl);
  }, X.k);
  p.rect(48, 20, 28, 18, X.screen);
  if (mood === 'idle') {
    p.rect(49, 21, 6, 1, X.nightD);
    p.rect(49, 22, 3, 1, X.nightD);
  } else {
    const colors = [X.code1, X.code2, X.code3, X.code4, X.code1, X.code3];
    const lengths = [14, 9, 18, 6, 12, 16, 8, 20, 11];
    const scroll = on ? Math.floor(f / 2) : 0;
    for (let i = 0; i < 8; i++) {
      const y = 22 + i * 2;
      const n = (i + scroll) % lengths.length;
      const indent = (n % 3) * 2;
      p.rect(
        50 + indent,
        y,
        Math.min(24 - indent, lengths[n]),
        1,
        trouble && i % 2 ? X.r : colors[n % colors.length],
      );
    }
    if (f % 8 < 4) p.rect(50 + (on ? (f % 12) * 2 : 4), 37, 2, 1, X.w);
    if (trouble) {
      const bx = 52 + ((f * 2) % 20);
      p.rect(bx, 28, 3, 2, X.r);
      p.set(bx + 1, 27, X.k);
      p.set(bx - 1, 28 + (f % 2), X.k);
      p.set(bx + 3, 29 - (f % 2), X.k);
    }
  }
  p.sprite(() => {
    const tail = on ? f % 6 < 3 : mood === 'trouble';
    p.line(22, 46, 16, tail ? 36 : 40, X.cat, 2);
    p.set(15, tail ? 35 : 39, X.catD);
    if (mood === 'idle') {
      p.ellipse(40, 41, 9, 4, X.hoodie);
      p.ellipse(48, 39, 5, 3.5, X.cat);
      p.set(45, 35, X.cat);
      p.set(51, 35, X.cat);
      p.rect(46, 39, 2, 1, X.catD);
      p.rect(49, 39, 2, 1, X.catD);
      p.rect(43, 37, 2, 4, X.r);
      return;
    }
    p.ellipse(30, 40, 8, 8, X.hoodie);
    p.rect(26, 38, 8, 1, X.hoodieD);
    p.ellipse(30, 28, 6, 5, X.cat);
    p.rect(25, 22, 2, 3, X.cat);
    p.rect(33, 22, 2, 3, X.cat);
    p.set(25, 22, X.catD);
    p.set(34, 22, X.catD);
    p.rect(24, 24, 13, 1, X.k);
    p.rect(23, 26, 2, 5, X.r);
    p.rect(36, 26, 2, 5, X.r);
    if (trouble) {
      for (const [x, y] of [
        [24, 21],
        [29, 21],
        [36, 21],
        [22, 29],
        [38, 29],
      ])
        p.set(x, y, X.cat);
      p.rect(27, 27, 2, 2, X.w);
      p.rect(31, 27, 2, 2, X.w);
      p.set(28, 28, X.k);
      p.set(31, 28, X.k);
    } else if (f % 24 === 0) {
      p.rect(27, 28, 2, 1, X.k);
      p.rect(31, 28, 2, 1, X.k);
    } else {
      p.set(28, 28, X.greenL);
      p.set(32, 28, X.greenL);
    }
    p.set(30, 30, X.pink);
    p.rect(29, 31, 3, 1, X.catD);
    const left = on && f % 2 === 0 ? 1 : 0;
    const right = on && f % 2 === 1 ? 1 : 0;
    p.ellipse(39, 41 - left, 2, 1.4, X.cat);
    p.ellipse(44, 41 - right, 2, 1.4, X.cat);
  }, X.k);
  if (mood !== 'trouble')
    for (let k = 0; k < 3; k++) {
      const y = 35 - ((f + k * 4) % 10);
      p.set(80 + Math.round(Math.sin(y * 0.8)), y, k % 2 ? X.g : X.w);
    }
  marks(p, f, mood, mood === 'idle' ? 52 : 38, 20, X.w);
};

const security: PixelScene = (p, f, mood) => {
  const on = mood === 'working';
  const trouble = mood === 'trouble';
  p.dither(0, 0, WIDTH, 50, X.castle, X.castleD, (_, j) => 0.2 + (j / 50) * 0.4);
  for (let y = 4; y < 50; y += 5) {
    p.rect(0, y, WIDTH, 1, X.castleD);
    const offset = (y / 5) % 2 ? 0 : 5;
    for (let x = offset; x < WIDTH; x += 10) p.rect(x, y - 4, 1, 4, X.castleD);
  }
  for (let x = 0; x < WIDTH; x += 8) p.rect(x, 0, 4, 3, X.castleD);
  for (let y = 14; y < 50; y++)
    for (let x = 52; x < 86; x++)
      if (y >= 28 || (x - 69) ** 2 + (y - 28) ** 2 <= 16 * 16) p.set(x, y, X.gate);
  for (let x = 54; x < 86; x += 4) p.rect(x, 14, 1, 36, X.bars);
  for (let y = 22; y < 50; y += 6) p.rect(52, y, 34, 1, X.bars);
  const lamp = trouble ? (f % 4 < 2 ? X.r : X.rl) : X.greenL;
  p.rect(67, 6, 5, 4, lamp);
  p.rect(66, 5, 7, 1, X.k);
  p.rect(66, 10, 7, 1, X.k);
  if (trouble || on)
    for (let y = 2; y < 16; y++)
      for (let x = 60; x < 80; x++) {
        const d = Math.hypot(x - 69, y - 8) / 9;
        if (d < 1 && d > 0.35) p.speckle(x, y, lamp, (1 - d) * 0.4);
      }
  p.dither(0, 50, WIDTH, 14, X.cobble, X.cobbleD, (i, j) => ((i * 3 + j * 7) % 11) / 14);
  p.sprite(() => {
    const lie = mood === 'idle' ? 4 : 0;
    p.ellipse(36, 44 + lie / 2, 10, 7 - lie / 2, X.dog);
    p.rect(29, 48, 3, 3 - lie / 2, X.dog);
    p.rect(40, 48, 3, 3 - lie / 2, X.dog);
    const bob = on && f % 4 < 2 ? 1 : 0;
    const hy = lie + bob;
    p.ellipse(28, 35 + hy, 7, 6, X.dogL);
    p.ellipse(28, 39 + hy, 6, 3, X.dogL);
    p.rect(21, 30 + hy, 3, 3, X.dogD);
    p.rect(33, 30 + hy, 3, 3, X.dogD);
    p.rect(22, 42 + hy, 13, 1, X.k);
    for (let x = 23; x < 35; x += 3) p.set(x, 43 + hy, X.steelL);
    if (mood === 'idle') {
      p.rect(25, 34 + hy, 2, 1, X.k);
      p.rect(30, 34 + hy, 2, 1, X.k);
    } else if (trouble) {
      p.rect(25, 33 + hy, 2, 2, X.w);
      p.rect(30, 33 + hy, 2, 2, X.w);
      p.set(26, 34 + hy, X.k);
      p.set(30, 34 + hy, X.k);
      p.rect(25, 39 + hy, 6, 2, X.k);
      p.set(26, 39 + hy, X.w);
      p.set(29, 39 + hy, X.w);
    } else {
      p.set(26, 34 + hy, X.k);
      p.set(31, 34 + hy, X.k);
      p.set(26, 40 + hy, X.w);
      p.set(30, 40 + hy, X.w);
    }
    p.rect(26, 37 + hy, 4, 2, X.k);
    p.ellipse(46, 44, 3, 3, X.gold);
    p.ellipse(46, 44, 1.6, 1.6, X.dog);
    p.rect(45, 47, 1, 4, X.gold);
    p.rect(48, 46, 1, 3, X.gold);
    p.set(46, 50, X.gold);
  }, X.k);
  if (on || trouble)
    for (let k = 0; k < 2; k++) {
      const x = 90 - ((f * 2 + k * 30) % 54);
      const y = 30 + k * 6 + Math.round(Math.sin((f + k * 7) / 3));
      p.rect(x, y, 6, 4, X.w);
      p.line(x, y, x + 3, y + 2, X.g);
      p.line(x + 5, y, x + 3, y + 2, X.g);
      if (x < 42) {
        if (trouble && k === 0) {
          p.line(x + 1, y + 1, x + 4, y + 3, X.r);
          p.line(x + 4, y + 1, x + 1, y + 3, X.r);
        } else {
          p.set(x + 1, y + 2, X.green);
          p.set(x + 2, y + 3, X.green);
          p.set(x + 4, y + 1, X.green);
          p.set(x + 3, y + 2, X.green);
        }
      }
    }
  marks(p, f, mood, 36, 22);
};

const maestro: PixelScene = (p, f, mood) => {
  const on = mood === 'working';
  const trouble = mood === 'trouble';
  p.dither(0, 0, WIDTH, 50, X.stage, X.stageD, (_, j) => 0.2 + (j / 50) * 0.5);
  for (let y = 0; y < 50; y++)
    for (let x = 28; x < 68; x++) {
      const d = Math.hypot((x - 48) / 1.3, y - 30) / 26;
      if (d < 1) p.speckle(x, y, X.sky2, (1 - d) * 0.5);
    }
  for (const side of [0, 84]) {
    p.dither(side, 0, 12, 52, X.curtain, X.curtainD, (i) => ((i + side) % 4 < 2 ? 0.15 : 0.7));
  }
  p.dither(0, 0, WIDTH, 5, X.curtain, X.curtainD, (i) => (i % 6 < 3 ? 0.2 : 0.6));
  p.rect(0, 50, WIDTH, 14, X.wood);
  p.rect(0, 50, WIDTH, 1, X.woodL);
  for (let x = 10; x < WIDTH; x += 12) p.rect(x, 51, 1, 13, X.woodD);
  p.sprite(() => {
    for (const x of [18, 76]) {
      p.rect(x, 38, 1, 12, X.k);
      p.rect(x - 4, 36, 9, 3, X.steelD);
      p.rect(x - 3, 36, 7, 1, X.w);
    }
    p.rect(38, 46, 20, 6, X.woodD);
    p.rect(38, 46, 20, 1, X.woodL);
    p.ellipse(48, 40, 7, 8, X.tails);
    p.rect(44, 44, 3, 3, X.tails);
    p.rect(50, 44, 3, 3, X.tails);
    p.rect(46, 33, 4, 9, X.w);
    p.rect(46, 33, 4, 1, X.r);
    p.set(45, 33, X.r);
    p.set(50, 33, X.r);
    const sway = on ? [0, 1, 0, -1][Math.floor(f / 2) % 4] : 0;
    p.ellipse(48 + sway, 27, 5, 5, X.s);
    p.ellipse(48 + sway, 22.5, 6, 3, X.hair);
    p.rect(42 + sway, 23, 2, 5, X.hair);
    p.rect(52 + sway, 23, 2, 5, X.hair);
    if (on || mood === 'idle') {
      p.rect(45 + sway, 27, 2, 1, X.k);
      p.rect(49 + sway, 27, 2, 1, X.k);
    } else if (trouble) {
      p.rect(45, 26, 2, 2, X.w);
      p.rect(49, 26, 2, 2, X.w);
      p.set(46, 27, X.k);
      p.set(49, 27, X.k);
    } else {
      p.set(46, 27, X.k);
      p.set(50, 27, X.k);
    }
    p.rect(46 + sway, 30, 4, 1, on ? X.k : X.sd);
    const swing: [number, number][] = [
      [60, 22],
      [62, 29],
      [58, 33],
      [56, 25],
    ];
    if (on) {
      const [hx, hy] = swing[Math.floor(f / 2) % 4];
      p.line(53, 34, hx, hy, X.tails, 2);
      p.ellipse(hx + 1, hy, 1.4, 1.4, X.s);
      p.line(hx + 1, hy, hx + 6, hy - 4, X.w);
      const left: [number, number] = f % 8 < 4 ? [38, 26] : [37, 30];
      p.line(43, 34, left[0], left[1], X.tails, 2);
      p.ellipse(left[0], left[1], 1.4, 1.4, X.s);
    } else if (trouble) {
      p.line(53, 34, 58, 38, X.tails, 2);
      p.line(43, 34, 38, 38, X.tails, 2);
      p.line(58, 38, 61, 36, X.w);
    } else if (mood === 'waiting') {
      p.line(53, 34, 58, 24, X.tails, 2);
      p.ellipse(58, 23, 1.4, 1.4, X.s);
      p.line(58, 23, 60, 16, X.w);
      p.line(43, 34, 40, 40, X.tails, 2);
    } else {
      p.line(53, 34, 50, 38, X.tails, 2);
      p.line(43, 34, 46, 38, X.tails, 2);
      p.ellipse(48, 38, 2, 1.4, X.s);
      p.line(44, 37, 53, 37, X.w);
    }
  }, X.k);
  if (on) {
    const cards = [X.indigo, X.code1, X.amber, X.teal, X.rose, X.code3];
    for (let k = 0; k < 6; k++) {
      const t = (f + k * 4) % 24;
      const dir = k % 2 ? 1 : -1;
      const x = 48 + dir * (6 + t * 1.6);
      const y = 20 - t * 0.5 + (k % 3) * 4;
      if (x < 10 || x > 84) continue;
      p.rect(x, y, 3, 2, cards[k]);
    }
  }
  if (mood === 'idle' || mood === 'waiting') {
    const t = f % 24;
    const x = 56 + Math.round(t / 4);
    const y = 22 - Math.round(t / 2);
    if (t < 20) {
      p.rect(x, y, 1, 4, X.amber);
      p.set(x - 1, y + 3, X.amber);
      p.rect(x + 1, y, 2, 1, X.amber);
    }
  }
  if (trouble) {
    p.rect(22, 54, 6, 4, X.w);
    p.rect(60, 56, 6, 4, X.w);
    p.rect(70, 52, 5, 4, X.w);
    p.rect(23, 55, 4, 1, X.g);
    p.rect(61, 57, 4, 1, X.g);
  }
  if (mood === 'waiting' && f % 8 < 4) p.set(51, 51, X.k);
  marks(p, f, mood, 58, 18, X.w);
};

export const SCENES: Readonly<Record<string, PixelScene>> = {
  kitchen,
  observation,
  travel,
  analysis,
  coding,
  security,
  assistant: maestro,
};

export function sceneFor(agent: string): PixelScene {
  return SCENES[agent] ?? maestro;
}

export function paint(agent: string, mood: AgentMood, frame: number): PixelFrame {
  const p = new PixelFrame();
  sceneFor(agent)(p, frame, mood);
  return p;
}

export const SIZE = { width: WIDTH, height: HEIGHT } as const;
