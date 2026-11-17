import type { AgentMood } from '../../../domain/agent-activity';
import { HEIGHT, PixelFrame, WIDTH, palette, type Color } from '../pixel-frame';

export type PixelScene = (p: PixelFrame, frame: number, mood: AgentMood) => void;
export type Point = readonly [x: number, y: number];

export const X = palette({
  purple: '#6b4fa0',
  purpleD: '#4a3373',
  robeBlue: '#2a3150',
  crimson: '#9b1d2a',
  crimsonD: '#6e1420',
  candle: '#fff4c2',
  marble: '#ece7dc',
  marbleD: '#cfc6b4',
  aegean: '#2f7fb5',
  aegeanL: '#7ec8e3',
  bronze: '#b8862f',
  bronzeD: '#8a6224',
  olive: '#7a8b3a',
  laurel: '#5f9a3a',
  paper2: '#f7f1e3',
  wallpaper: '#cfe0ee',
  wallpaperD: '#b9cfe2',
  blush: '#e8b4c0',
  gilt: '#d9b26a',
  copper: '#c46a3a',
  copperD: '#8f4a26',
  obsidian: '#1c1412',
  obsidianL: '#2e211d',
  ember: '#e35d3a',
  emberL: '#f08a5d',
  ash: '#3a2a24',
  iron: '#3c424c',
  ironL: '#5c6470',
  scale: '#3f6b3a',
  scaleD: '#2c4c29',
  scaleL: '#5f9a55',
  grass: '#6fbf4a',
  grassD: '#4f9a35',
  grassL: '#9be06a',
  lcd0: '#0f380f',
  lcd1: '#306230',
  lcd2: '#8bac0f',
  lcd3: '#9bbc0f',
  crystal: '#8fe3ff',
  crystalD: '#4fb3d9',
  spark: '#fff36b',
  fox: '#f0a640',
  foxD: '#c97a22',
  cloudD: '#d7e6f5',
  sal: '#ff7a45',
  salD: '#d9512a',
  armadillo: '#a08c74',
  armadilloD: '#7a6a56',
  star: '#ffd75e',
  starD: '#e0a92e',

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

export function marks(
  p: PixelFrame,
  f: number,
  mood: AgentMood,
  x: number,
  y: number,
  ink = X.k,
): void {
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

export function smoke(p: PixelFrame, f: number, x: number, y: number): void {
  for (let k = 0; k < 9; k++) {
    const rise = (f + k * 3) % 18;
    const cx = x + ((k * 5) % 9) - 4 + Math.round(Math.sin((rise + k) * 0.5) * 1.5);
    const cy = y - rise;
    p.ellipse(cx, cy, 1.6 + rise / 9, 1.4 + rise / 10, k % 2 ? X.smoke : X.smokeL);
  }
}

export interface Look {
  readonly skin: Color;
  readonly hair?: Color;
  readonly hairStyle?: 'short' | 'long' | 'wild' | 'bun' | 'curls';
  readonly beard?: Color;
  readonly robe: Color;
  readonly robeDark: Color;
  readonly trim?: Color;
  readonly hat?:
    | 'pointy'
    | 'toque'
    | 'helm'
    | 'laurel'
    | 'bonnet'
    | 'tophat'
    | 'hood'
    | 'cap'
    | 'circlet'
    | 'wig';
  readonly hatColor?: Color;
  readonly hatTrim?: Color;
  readonly skirt?: boolean;
}

export interface Hands {
  readonly left: Point;
  readonly right: Point;
}

export function pose(
  x: number,
  ground: number,
  mood: AgentMood,
  f: number,
  work: readonly Point[],
  left?: readonly Point[],
): Hands {
  const top = ground - 14;
  const rest: Hands = { left: [x - 6, top + 9], right: [x + 5, top + 9] };
  if (mood === 'working') {
    const i = Math.floor(f / 2);
    const [dx, dy] = work[i % work.length];
    const l = left ? left[i % left.length] : null;
    return { left: l ? [x + l[0], top + l[1]] : rest.left, right: [x + dx, top + dy] };
  }
  if (mood === 'waiting') return { left: rest.left, right: [x + 7, top - 6] };
  if (mood === 'trouble')
    return { left: [x - 8, top - 5 + (f % 2)], right: [x + 7, top - 5 + ((f + 1) % 2)] };
  return rest;
}

export function headY(ground: number): number {
  return ground - 19;
}

export function figure(
  p: PixelFrame,
  f: number,
  mood: AgentMood,
  x: number,
  ground: number,
  look: Look,
  hands: Hands,
): void {
  const top = ground - 14;
  const hy = top - 5;
  const hair = look.hair ?? X.b;
  if (look.hat === 'hood' && look.hatColor) p.ellipse(x, hy, 6, 6.5, look.hatColor);
  if (look.hat === 'bonnet' && look.hatColor) p.ellipse(x, hy - 1, 6.5, 6, look.hatColor);
  if (look.hairStyle === 'long') p.rect(x - 5, hy - 2, 10, 9, hair);
  for (let j = 0; j < 14; j++) {
    const w = Math.round(8 + (j * (look.skirt ? 8 : 4)) / 13);
    p.rect(x - Math.floor(w / 2), top + j, w, 1, look.robe);
    p.rect(x + Math.ceil(w / 2) - 2, top + j, 2, 1, look.robeDark);
  }
  if (look.trim) {
    p.set(x - 2, top, look.trim);
    p.set(x - 1, top + 1, look.trim);
    p.set(x + 1, top + 1, look.trim);
    p.set(x + 2, top, look.trim);
    p.rect(x - 4, top + 6, 9, 1, look.trim);
  }
  p.line(x - 4, top + 2, hands.left[0], hands.left[1], look.robe, 2);
  p.line(x + 3, top + 2, hands.right[0], hands.right[1], look.robe, 2);
  p.rect(hands.left[0], hands.left[1], 2, 2, look.skin);
  p.rect(hands.right[0], hands.right[1], 2, 2, look.skin);
  p.ellipse(x, hy, 4.5, 4.5, look.skin);
  switch (look.hairStyle) {
    case 'short':
    case 'long':
      p.ellipse(x, hy - 3, 4.8, 2.4, hair);
      break;
    case 'wild':
      p.ellipse(x, hy - 3, 5.8, 3, hair);
      p.ellipse(x - 5, hy - 1, 1.5, 2, hair);
      p.ellipse(x + 5, hy - 1, 1.5, 2, hair);
      break;
    case 'bun':
      p.ellipse(x, hy - 3, 4.8, 2.4, hair);
      p.ellipse(x, hy - 6.5, 2, 2, hair);
      break;
    case 'curls':
      for (const dx of [-4, -2, 0, 2, 4]) p.ellipse(x + dx, hy - 4, 1.6, 1.6, hair);
      p.ellipse(x - 5, hy, 1.5, 2, hair);
      p.ellipse(x + 5, hy, 1.5, 2, hair);
      break;
  }
  if (mood === 'idle') {
    p.rect(x - 3, hy, 2, 1, X.k);
    p.rect(x + 1, hy, 2, 1, X.k);
  } else if (mood === 'trouble') {
    p.rect(x - 3, hy - 1, 2, 2, X.w);
    p.rect(x + 1, hy - 1, 2, 2, X.w);
    p.set(x - 2, hy, X.k);
    p.set(x + 1, hy, X.k);
    p.rect(x - 1, hy + 2, 2, 2, X.k);
  } else if (f % 30 === 0) {
    p.rect(x - 3, hy, 2, 1, X.k);
    p.rect(x + 1, hy, 2, 1, X.k);
  } else {
    p.rect(x - 2, hy - 1, 1, 2, X.k);
    p.rect(x + 1, hy - 1, 1, 2, X.k);
    if (!look.beard) p.rect(x - 1, hy + 2, 2, 1, X.sd);
  }
  if (look.beard) {
    p.ellipse(x, hy + 3.5, 3.6, 2.8, look.beard);
    p.rect(x - 2, hy + 5, 4, 3, look.beard);
  }
  const hat = look.hatColor ?? X.k;
  const trim = look.hatTrim ?? X.y;
  switch (look.hat) {
    case 'pointy':
      for (let j = 0; j < 10; j++) {
        const w = 1 + Math.floor(j * 1.2);
        p.rect(x - Math.floor(w / 2), hy - 14 + j, w, 1, hat);
      }
      p.set(x + 1, hy - 15, hat);
      p.rect(x - 6, hy - 4, 13, 1, hat);
      p.set(x, hy - 9, trim);
      break;
    case 'toque':
      p.ellipse(x - 3, hy - 8, 3, 3, X.w);
      p.ellipse(x, hy - 10, 3.5, 3.5, X.w);
      p.ellipse(x + 3, hy - 8, 3, 3, X.w);
      p.rect(x - 4, hy - 6, 9, 3, X.w);
      break;
    case 'helm':
      p.rect(x - 5, hy - 6, 11, 4, hat);
      p.rect(x - 5, hy - 2, 2, 5, hat);
      p.rect(x + 4, hy - 2, 2, 5, hat);
      p.rect(x - 1, hy - 9, 3, 3, trim);
      break;
    case 'laurel':
      for (const dx of [-5, -4, -2, 2, 4, 5])
        p.set(x + dx, hy - 3 - (Math.abs(dx) < 3 ? 2 : 0), X.laurel);
      for (const dx of [-3, -1, 1, 3]) p.set(x + dx, hy - 5, X.laurel);
      break;
    case 'bonnet':
      p.rect(x - 5, hy + 3, 2, 1, trim);
      p.rect(x + 4, hy + 3, 2, 1, trim);
      break;
    case 'tophat':
      p.rect(x - 3, hy - 13, 7, 8, hat);
      p.rect(x - 3, hy - 7, 7, 1, trim);
      p.rect(x - 5, hy - 5, 11, 1, hat);
      break;
    case 'hood':
      p.ellipse(x, hy - 4, 5, 2.4, hat);
      break;
    case 'cap':
      p.rect(x - 4, hy - 6, 9, 3, hat);
      p.rect(x + 2, hy - 4, 5, 1, hat);
      break;
    case 'circlet':
      p.rect(x - 4, hy - 4, 9, 1, X.gold);
      p.set(x, hy - 4, trim);
      break;
    case 'wig':
      p.ellipse(x, hy - 3, 5.2, 3, X.w);
      p.ellipse(x - 5, hy + 1, 1.6, 2.2, X.w);
      p.ellipse(x + 5, hy + 1, 1.6, 2.2, X.w);
      break;
  }
}

export function sky(p: PixelFrame, a: Color, b: Color, height: number, amount = 0.6): void {
  p.dither(0, 0, WIDTH, height, a, b, (_, j) => 0.1 + (j / height) * amount);
}

export function ground(p: PixelFrame, y: number, a: Color, b: Color, line: Color): void {
  p.rect(0, y, WIDTH, HEIGHT - y, a);
  p.rect(0, y, WIDTH, 1, line);
  for (let x = 6; x < WIDTH; x += 14) p.rect(x, y + 2, 1, HEIGHT - y - 2, b);
}

export function glow(
  p: PixelFrame,
  cx: number,
  cy: number,
  radius: number,
  color: Color,
  amount: number,
): void {
  for (let y = Math.floor(cy - radius); y <= cy + radius; y++)
    for (let x = Math.floor(cx - radius); x <= cx + radius; x++) {
      const d = Math.hypot(x - cx, y - cy) / radius;
      if (d < 1) p.speckle(x, y, color, (1 - d) * amount);
    }
}

export function candle(p: PixelFrame, f: number, x: number, y: number, phase = 0): void {
  p.rect(x, y, 2, 4, X.candle);
  p.set(x + ((f + phase) % 2), y - 1, X.y);
  p.set(x + ((f + phase) % 2), y - 2, (f + phase) % 3 ? X.o : X.yl);
}

export function sparkle(p: PixelFrame, f: number, x: number, y: number, color: Color): void {
  const t = f % 6;
  if (t < 3) {
    p.set(x, y, color);
    if (t === 1) {
      p.set(x - 1, y, color);
      p.set(x + 1, y, color);
      p.set(x, y - 1, color);
      p.set(x, y + 1, color);
    }
  }
}
