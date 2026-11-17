import type { AgentMood } from '../../../domain/agent-activity';
import { HEIGHT, PixelFrame, WIDTH } from '../pixel-frame';
import { X, type PixelScene } from './kit';

const INK = X.lcd0;
const SHADE = X.lcd1;
const DIM = X.lcd2;
const PAPER = X.lcd3;

const ICONS: readonly (readonly string[])[] = [
  ['.##.', '#..#', '#..#', '.##.'],
  ['#..#', '.##.', '.##.', '#..#'],
  ['.#.#', '####', '####', '.##.'],
  ['..#.', '.##.', '###.', '#...'],
  ['####', '#.##', '##.#', '####'],
];

function screen(p: PixelFrame, f: number, mood: AgentMood, active: number): void {
  p.rect(0, 0, WIDTH, HEIGHT, PAPER);
  for (let y = 0; y < HEIGHT; y += 2) for (let x = (y / 2) % 2; x < WIDTH; x += 2) p.set(x, y, DIM);
  ICONS.forEach((icon, i) => {
    const x0 = 6 + i * 18;
    icon.forEach((row, j) =>
      [...row].forEach((c, k) => c === '#' && p.set(x0 + k, 3 + j, i === active ? INK : SHADE)),
    );
    if (i === active && f % 8 < 4) p.rect(x0 - 2, 9, 8, 1, INK);
  });
  p.rect(0, 11, WIDTH, 1, SHADE);
  p.rect(0, 54, WIDTH, 1, SHADE);
  p.rect(0, 55, WIDTH, 9, PAPER);
  const clock = `${String(12 + (mood === 'idle' ? 0 : Math.floor(f / 60) % 10)).padStart(2, '0')}`;
  for (let i = 0; i < clock.length + 2; i++) p.rect(70 + i * 4, 58, 3, 3, i === 2 ? PAPER : SHADE);
  for (let i = 0; i < 4; i++)
    p.rect(6 + i * 6, 58, 4, 3, i < (mood === 'trouble' ? 1 : 3) ? INK : SHADE);
}

const SCALE = 2;

function sprite(
  p: PixelFrame,
  f: number,
  mood: AgentMood,
  art: readonly string[],
  x: number,
  y: number,
): void {
  art.forEach((row, j) =>
    [...row].forEach((c, i) => {
      const px = x + i * SCALE;
      const py = y + j * SCALE;
      if (c === '#') p.rect(px, py, SCALE, SCALE, INK);
      else if (c === '+') p.rect(px, py, SCALE, SCALE, SHADE);
      else if (c === '_') p.rect(px, py, SCALE, SCALE, PAPER);
      else if (c === 'o') eye(p, f, mood, px, py);
    }),
  );
}

function eye(p: PixelFrame, f: number, mood: AgentMood, x: number, y: number): void {
  if (mood === 'idle' || (mood !== 'trouble' && f % 24 === 0)) {
    p.rect(x, y, SCALE, SCALE, SHADE);
    p.rect(x, y + 1, SCALE, 1, INK);
  } else if (mood === 'trouble') {
    p.rect(x, y, SCALE, SCALE, f % 2 ? INK : PAPER);
  } else {
    p.rect(x, y, SCALE, SCALE, PAPER);
    p.set(x + 1, y + 1, INK);
  }
}

function glitch(p: PixelFrame, f: number): void {
  for (let k = 0; k < 5; k++) {
    const y = 12 + ((f * 7 + k * 11) % 42);
    p.rect((f * 5 + k * 13) % 60, y, 10 + ((k * 7) % 20), 1, k % 2 ? INK : PAPER);
  }
  for (let k = 0; k < 20; k++) p.set((f * 17 + k * 29) % WIDTH, 12 + ((f * 3 + k * 7) % 42), INK);
}

function moodMarks(p: PixelFrame, f: number, mood: AgentMood, x: number, y: number): void {
  if (mood === 'idle') {
    const rise = f % 16;
    if (rise < 12) p.letterZ(x, y - Math.floor(rise / 2), INK);
    if (rise > 5) p.letterZ(x + 5, y - 6 - Math.floor((rise - 6) / 2), SHADE);
  } else if (mood === 'waiting') p.bubble(x, y - 4, '?', PAPER, INK);
  else if (mood === 'trouble' && f % 8 < 6) p.bubble(x, y - 4, '!', PAPER, INK);
}

function bounce(f: number, mood: AgentMood): number {
  if (mood === 'idle') return 2;
  if (mood === 'trouble') return f % 2;
  return f % 4 < 2 ? 0 : -1;
}

const DRAKE = [
  '....##......',
  '...#++#.....',
  '..#+oo+##...',
  '..#++++++#..',
  '.##+++++#...',
  '#.#++++++#..',
  '..#++++++##.',
  '..#+#++#+#.#',
  '...#.##.#...',
  '...##..##...',
];

const bytedrake: PixelScene = (p, f, mood) => {
  screen(p, f, mood, 0);
  const x = 36;
  const y = 32 + bounce(f, mood);
  sprite(p, f, mood, DRAKE, x, y);
  p.line(x + 10, y, x + 14, y - 6, INK);
  p.rect(x + 14, y - 8, 3, 3, INK);
  if (mood === 'working')
    for (let k = 0; k < 4; k++) {
      const t = (f + k * 4) % 16;
      const dir = k % 2 ? 1 : -1;
      const px = x + 6 + dir * (10 + t * 2);
      if (px > 2 && px < 92) p.rect(px, y - 2 + (k % 3) * 4, 3, 3, k % 2 ? INK : SHADE);
    }
  if (mood === 'trouble') glitch(p, f);
  moodMarks(p, f, mood, x + 14, y - 10);
};

const CHEF = [
  '..#####..',
  '.#_____#.',
  '.#_____#.',
  '..#####..',
  '.#+o+o+#.',
  '#+++++++#',
  '#+++++++#',
  '#+++++++#',
  '.#+++++#.',
  '..#####..',
];

const chefbit: PixelScene = (p, f, mood) => {
  screen(p, f, mood, 2);
  const x = 22;
  const y = 32 + bounce(f, mood);
  sprite(p, f, mood, CHEF, x, y);
  if (mood === 'working' || mood === 'waiting') {
    const bites = mood === 'working' ? Math.floor(f / 4) % 4 : 0;
    p.ellipse(60, 40, 5 - bites, 4 - bites * 0.6, INK);
    p.rect(64 - bites, 38, 6, 2, SHADE);
    p.ellipse(68 - bites, 39, 1.5, 1.5, SHADE);
    if (mood === 'working' && f % 4 < 2) p.rect(x + 6, y + 15, 6, 2, INK);
  }
  if (mood === 'trouble') {
    for (let k = 0; k < 4; k++) p.rect(52 + k * 6, 30 - ((f + k * 2) % 8), 3, 3, SHADE);
    glitch(p, f);
  }
  moodMarks(p, f, mood, x + 12, y - 10);
};

const PATH = ['...##...', '..#++#..', '#.#oo#.#', '##++++##', '#.#++#.#', '..#..#..'];

const pathpix: PixelScene = (p, f, mood) => {
  screen(p, f, mood, 3);
  const flying = mood !== 'idle';
  const scroll = mood === 'working' ? f * 2 : 0;
  for (let x = 0; x < WIDTH; x += 8) p.rect((x - (scroll % 8) + WIDTH) % WIDTH, 50, 4, 1, INK);
  const x = 40;
  const y = flying ? 24 + Math.round(Math.sin(f / 2) * 2) : 38;
  sprite(p, f, mood, PATH, x, y);
  if (flying && f % 2) {
    p.rect(x - 2, y + 2, 2, 2, INK);
    p.rect(x + 16, y + 2, 2, 2, INK);
  }
  if (mood === 'working')
    for (let k = 0; k < 3; k++) p.rect(x - 8 - ((f + k * 3) % 10), y + 2 + k * 2, 4, 1, SHADE);
  if (mood === 'trouble') glitch(p, f);
  moodMarks(p, f, mood, x + 12, y - 8);
};

const BUG = [
  '.#....#.',
  '..#..#..',
  '.######.',
  '#+o++o+#',
  '#++++++#',
  '#++++++#',
  '.######.',
  '#.#..#.#',
];

const scanbug: PixelScene = (p, f, mood) => {
  screen(p, f, mood, 1);
  const x = 22;
  const y = 36 + bounce(f, mood);
  sprite(p, f, mood, BUG, x, y);
  if (mood === 'working' || mood === 'trouble') {
    const r = (f % 6) * 5 + 6;
    for (let a = -0.9; a <= 0.9; a += 0.08) {
      p.set(Math.round(x + 16 + Math.cos(a) * r), Math.round(y - 2 + Math.sin(a) * r * 0.6), SHADE);
    }
    if (f % 12 < 6) p.rect(70, 30, 3, 3, INK);
  }
  if (mood === 'trouble') glitch(p, f);
  moodMarks(p, f, mood, x + 12, y - 10);
};

const REX = [
  '....####.',
  '...#++o+#',
  '...#+++++',
  '...#++###',
  '#..#++#..',
  '##.#+++#.',
  '.###++++#',
  '..#+++++#',
  '...#+##+#',
  '...#.#..#',
];

const graphrex: PixelScene = (p, f, mood) => {
  screen(p, f, mood, 4);
  const x = 10;
  const stomp = mood === 'working' && f % 4 < 2 ? 1 : 0;
  const y = 32 + stomp + (mood === 'idle' ? 1 : 0);
  sprite(p, f, mood, REX, x, y);
  const heights = [6, 12, 9, 16, 13];
  const progress = mood === 'working' ? (f % 30) / 18 : mood === 'trouble' ? 0.3 : 1;
  heights.forEach((h, i) => {
    const shown = Math.max(1, Math.min(h, Math.round(progress * 5 * h - i * h)));
    p.rect(42 + i * 8, 50 - shown, 5, shown, i % 2 ? INK : SHADE);
  });
  if (mood === 'trouble') glitch(p, f);
  moodMarks(p, f, mood, x + 14, y - 10);
};

const CAT = [
  '#.....#.',
  '##...##.',
  '#+#+#+#.',
  '#+o++o+#',
  '#++++++#',
  '.#++++#.',
  '.#+##+#.',
  '.##..##.',
];

const codekit: PixelScene = (p, f, mood) => {
  screen(p, f, mood, 2);
  const x = 18;
  const y = 36 + bounce(f, mood);
  if (mood !== 'idle') {
    const cols = [52, 58, 64, 70, 76, 82];
    cols.forEach((cx, i) => {
      const fall = mood === 'working' ? (f * 2 + i * 7) % 40 : (i * 7) % 40;
      const y0 = 13 + fall;
      if (y0 < 50) {
        if ((i + Math.floor(f / 4)) % 2) p.rect(cx, y0, 1, 4, INK);
        else {
          p.rect(cx - 1, y0, 3, 1, SHADE);
          p.rect(cx - 1, y0 + 3, 3, 1, SHADE);
          p.rect(cx - 1, y0, 1, 4, SHADE);
          p.rect(cx + 1, y0, 1, 4, SHADE);
        }
      }
    });
  }
  sprite(p, f, mood, CAT, x, y);
  p.rect(x + 17, y + 13, 14, 3, INK);
  if (mood === 'working') p.rect(x + 18 + (f % 5) * 2, y + 11, 2, 2, SHADE);
  if (mood === 'trouble') glitch(p, f);
  moodMarks(p, f, mood, x + 12, y - 10);
};

const WYRM = [
  '...####...',
  '..#+oo+#..',
  '..#++++#..',
  '...#++#...',
  '.###++###.',
  '#++++++++#',
  '#+######+#',
  '#+#____#+#',
  '#+#____#+#',
  '#+######+#',
  '.########.',
];

const firewyrm: PixelScene = (p, f, mood) => {
  screen(p, f, mood, 1);
  const x = 24;
  const y = 30 + (mood === 'trouble' ? f % 2 : 0);
  sprite(p, f, mood, WYRM, x, y);
  if (mood === 'working' || mood === 'trouble')
    for (let k = 0; k < 2; k++) {
      const t = (f * 2 + k * 18) % 36;
      const px = 90 - t;
      if (px > x + 24) p.rect(px, y + 8 + k * 6, 3, 3, INK);
      else p.rect(x + 26 + (t % 3), y + 4 + k * 10, 2, 2, SHADE);
    }
  if (mood === 'trouble') glitch(p, f);
  moodMarks(p, f, mood, x + 14, y - 8);
};

export const DIGITAL: Readonly<Record<string, PixelScene>> = {
  assistant: bytedrake,
  kitchen: chefbit,
  travel: pathpix,
  observation: scanbug,
  analysis: graphrex,
  coding: codekit,
  security: firewyrm,
};
