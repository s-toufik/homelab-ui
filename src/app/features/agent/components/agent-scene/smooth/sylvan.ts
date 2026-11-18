import type { AgentMood } from '../../../domain/agent-activity';
import {
  TAU,
  W,
  box,
  dusk,
  ease,
  finish,
  fire,
  glow,
  hash,
  leaf,
  lerp,
  lin,
  line,
  oval,
  pose,
  rad,
  rgba,
  shape,
  smoke,
  steam,
  type ArmSpec,
  type BubbleStyle,
  type Ctx,
  type Hands,
  type Point,
  type SmoothScene,
} from './kit';

const BUBBLE: BubbleStyle = { paper: '#fbf6e2', ink: '#2f5a33', edge: '#b9a46a' };
const NIGHT = '#1d2b52';
const Z = '#f5f0c8';

function trunk(g: Ctx, x: number, w: number, top = -5): void {
  shape(
    g,
    `M ${x - w} 176 C ${x - w * 0.75} 130 ${x - w * 0.55} 60 ${x - w * 0.5} ${top} L ${x + w * 0.5} ${top} C ${x + w * 0.55} 60 ${x + w * 0.75} 130 ${x + w} 176 Z`,
    lin(g, x - w, 0, x + w, 0, '#2a2017', '#5a4532', '#7a6247', '#3a2c1f'),
  );
  g.save();
  g.strokeStyle = 'rgba(25,18,10,0.35)';
  g.lineWidth = 0.8;
  for (let i = 0; i < 5; i++) {
    const bx = x - w * 0.4 + i * w * 0.2;
    g.beginPath();
    g.moveTo(bx, 172);
    g.bezierCurveTo(bx + 2, 120, bx - 2, 70, bx + 1, top);
    g.stroke();
  }
  g.restore();
  oval(g, x - w * 0.3, 120, w * 0.25, 7, 'rgba(120,160,70,0.55)');
  oval(g, x + w * 0.2, 60, w * 0.2, 5, 'rgba(120,160,70,0.45)');
}

function fern(
  g: Ctx,
  x: number,
  y: number,
  len: number,
  ang: number,
  t: number,
  hex = '#4c7d38',
): void {
  g.save();
  g.translate(x, y);
  g.rotate(ang + Math.sin(t * 1.1 + x) * 0.05);
  g.strokeStyle = hex;
  g.lineWidth = 1;
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(len * 0.6, -len * 0.12, len, len * 0.08);
  g.stroke();
  for (let i = 1; i < 10; i++) {
    const p = i / 10;
    const px = len * p;
    const py = -len * 0.12 * Math.sin(p * Math.PI) + p * p * len * 0.08;
    const l = (1 - p) * len * 0.3 + 1.5;
    leaf(g, px, py, l, -1.15, hex);
    leaf(g, px, py, l, 1.15, hex);
  }
  g.restore();
}

function forest(g: Ctx, t: number, mood: AgentMood): void {
  g.fillStyle = lin(g, 0, 0, 0, 160, '#f6efc6', '#cfe0a6', '#7fa874');
  g.fillRect(0, 0, W, 200);
  for (let i = 0; i < 9; i++) {
    const x = 8 + i * 35 + hash(i) * 14;
    const w = 5 + hash(i + 4) * 7;
    shape(
      g,
      `M ${x - w / 2} 160 C ${x - w / 2 + 1} 100 ${x - w / 3} 40 ${x - w / 4} -5 L ${x + w / 4} -5 C ${x + w / 3} 40 ${x + w / 2 - 1} 100 ${x + w / 2} 160 Z`,
      'rgba(104,140,98,0.5)',
    );
  }
  for (let i = 0; i < 15; i++)
    oval(g, i * 22 - 4, 4 + hash(i + 2) * 16, 24, 17, 'rgba(118,158,104,0.55)');
  for (let i = 0; i < 12; i++)
    oval(g, i * 28 + 8, -4 + hash(i + 7) * 10, 22, 14, 'rgba(88,128,82,0.5)');
  g.save();
  g.globalCompositeOperation = 'lighter';
  const shafts: [number, number][] = [
    [64, 0.9],
    [148, 1.3],
    [228, 0.7],
  ];
  shafts.forEach(([x0, k], i) => {
    const a = (mood === 'idle' ? 0.05 : 0.2) + 0.08 * Math.sin(t * 0.6 * k + i);
    shape(
      g,
      `M ${x0} -5 L ${x0 + 22} -5 L ${x0 + 96} 178 L ${x0 + 50} 178 Z`,
      lin(g, x0, 0, x0 + 60, 178, rgba('#fff4c4', a), rgba('#fff4c4', 0)),
    );
  });
  g.restore();
}

function ground(g: Ctx, t: number): void {
  const edge = 'M 0 160 C 60 151 120 163 180 157 C 230 152 270 155 300 151';
  shape(g, `${edge} L 300 200 L 0 200 Z`, lin(g, 0, 150, 0, 200, '#6f9b4b', '#3d6130', '#20361b'));
  shape(g, edge, null, 'rgba(178,214,110,0.75)', 1.4);
  for (let i = 0; i < 26; i++) {
    const x = hash(i + 40) * W;
    const y = 160 + hash(i + 41) * 34;
    leaf(
      g,
      x,
      y,
      3 + hash(i) * 2,
      hash(i + 3) * TAU,
      i % 3 ? 'rgba(160,190,90,0.4)' : 'rgba(210,170,80,0.45)',
    );
  }
  fern(g, 18, 172, 26, -1.25, t);
  fern(g, 30, 176, 22, -0.55, t, '#5a8e40');
  fern(g, 284, 172, 26, -1.9, t);
  fern(g, 272, 177, 19, -2.55, t, '#5a8e40');
}

function motes(g: Ctx, t: number, mood: AgentMood): void {
  const night = mood === 'idle';
  for (let i = 0; i < (night ? 12 : 7); i++) {
    const x = (hash(i + 20) * W + Math.sin(t * 0.5 + i) * 12 + W) % W;
    const y = 40 + hash(i + 21) * 110 + Math.cos(t * 0.7 + i * 2) * 8;
    const a = 0.5 + 0.5 * Math.sin(t * 2 + i * 1.7);
    glow(g, x, y, night ? 7 : 4, night ? '#e6ff8a' : '#fff6c0', a * (night ? 0.9 : 0.5));
  }
  if (!night)
    for (let i = 0; i < 4; i++) {
      const p = (t * 0.07 + i / 4) % 1;
      const x = (hash(i + 30) * W + p * 60 + Math.sin(p * 12 + i) * 10 + W) % W;
      leaf(
        g,
        x,
        p * 200 - 10,
        5,
        t * 1.8 + i,
        mood === 'trouble' ? '#8a5a2a' : i % 2 ? '#d9a441' : '#9cc44f',
      );
    }
}

type Pair = readonly [string, string];

interface Elf {
  readonly robe: Pair;
  readonly trim: string;
  readonly hair: Pair;
  readonly arms: { readonly back: ArmSpec; readonly front: ArmSpec };
  readonly cloak?: Pair;
  readonly hood?: boolean;
  readonly skin?: Pair;
  readonly sleeve?: Pair;
  readonly apron?: Pair;
  readonly belt?: string;
  readonly brow?: string;
  readonly eye?: string;
  readonly crown?: boolean;
  readonly tie?: boolean;
  readonly prop?: (g: Ctx, h: Hands) => void;
  readonly after?: (g: Ctx, h: Hands) => void;
}

function elf(g: Ctx, x: number, ground0: number, t: number, mood: AgentMood, o: Elf): Point {
  g.save();
  g.translate(x, ground0);
  const calm = mood === 'idle';
  const b = Math.sin(t * 1.7) * 0.6;
  const sway = Math.sin(t * 1.3) * 1.4;
  const skin = o.skin ?? ['#f8e1cc', '#e0b597'];
  const hair = o.hair;
  const robe = o.robe;
  const SB: Point = [-4, -70 + b];
  const SF: Point = [4, -70 + b];
  const lb = pose(SB, o.arms.back, 16, 15);
  const lf = pose(SF, o.arms.front, 16, 15);
  if (!o.hood)
    shape(
      g,
      `M 9 ${-95 + b} C 5 ${-105 + b} -11 ${-105 + b} -13 ${-93 + b} C -16 -82 -15 -66 ${-17 + sway * 0.6} -52 C -11 -55 -7 -61 -5 -72 Z`,
      lin(g, 0, -105, 0, -52, hair[0], hair[1]),
    );
  line(g, [SB, lb.elbow, lb.hand], o.sleeve?.[1] ?? robe[1], 5.4);
  oval(g, lb.hand[0], lb.hand[1], 2.6, 2.6, skin[1]);
  if (o.cloak)
    shape(
      g,
      `M -8 ${-73 + b} C -17 -56 ${-23 + sway} -22 ${-26 + sway} -1 L ${12 + sway} -1 C 6 -30 2 -55 7 ${-73 + b} Z`,
      lin(g, -22, -70, 6, 0, o.cloak[0], o.cloak[1]),
    );
  if (o.hood && o.cloak)
    shape(
      g,
      `M -11 ${-88 + b} C -14 ${-106 + b} 9 ${-110 + b} 14 ${-95 + b} C 13 ${-91 + b} 12 ${-89 + b} 11 ${-88 + b} C 8 ${-97 + b} -3 ${-99 + b} -6 ${-91 + b} C -7 ${-84 + b} -6 ${-78 + b} -4 ${-72 + b} C -12 -66 -18 -58 -20 -50 C -18 -62 -14 ${-76 + b} -11 ${-88 + b} Z`,
      lin(g, -12, -105, 10, -70, o.cloak[0], o.cloak[1]),
    );
  shape(
    g,
    `M -9 ${-71 + b} C -12 -62 -10 -54 -8 -48 C -12 -32 ${-16 + sway * 0.6} -14 ${-18 + sway} 0 L ${18 + sway} 0 C ${15 + sway * 0.6} -14 11 -32 8 -48 C 10 -55 11 -63 9 ${-71 + b} C 4 ${-74 + b} -4 ${-74 + b} -9 ${-71 + b} Z`,
    lin(g, -12, -70, 16, 0, robe[0], robe[1]),
  );
  g.save();
  g.strokeStyle = 'rgba(20,30,15,0.16)';
  g.lineWidth = 0.9;
  for (const k of [-5, 1, 7]) {
    g.beginPath();
    g.moveTo(k * 0.6, -46);
    g.quadraticCurveTo(k * 1.2 + sway * 0.4, -24, k * 1.8 + sway, -1);
    g.stroke();
  }
  g.restore();
  if (o.apron)
    shape(
      g,
      `M -6 -48 L 7 -48 C 9 -34 10 -20 ${10 + sway * 0.5} -8 C 4 -6 -4 -6 ${-8 + sway * 0.5} -8 C -7 -20 -7 -34 -6 -48 Z`,
      lin(g, 0, -48, 0, -8, o.apron[0], o.apron[1]),
    );
  for (let i = 0; i < 7; i++)
    leaf(g, -17 + i * 5.7 + sway, -0.5, 3.6, Math.PI / 2 + (i % 2 ? 0.35 : -0.35), o.trim);
  box(g, -8.6, -50, 17.2, 3, 1.5, o.belt ?? '#6b4a2a');
  leaf(g, -1.5, -48.5, 5, -0.4, o.trim);
  g.fillStyle = skin[1];
  g.fillRect(-2.4, -77 + b, 4.8, 6);
  g.save();
  g.translate(1, -76 + b);
  g.rotate(calm ? 0.2 : mood === 'waiting' ? -0.08 : mood === 'trouble' ? 0.05 : 0);
  g.translate(-1, 76 - b);
  shape(
    g,
    `M -4 ${-86 + b} C -9 ${-88 + b} -15 ${-95 + b} -19 ${-102 + b} C -14 ${-98 + b} -8 ${-93 + b} -4 ${-90 + b} Z`,
    skin[1],
  );
  shape(
    g,
    `M -7 ${-89 + b} C -7 ${-99 + b} 10 ${-99 + b} 10 ${-89 + b} C 10 ${-82 + b} 7 ${-76 + b} 3 ${-75.5 + b} C -2 ${-75.5 + b} -7 ${-80 + b} -7 ${-89 + b} Z`,
    lin(g, 10, -98, -6, -76, skin[0], skin[1]),
  );
  oval(g, 6.4, -81 + b, 2.3, 1.3, 'rgba(232,120,110,0.35)');
  const ey = -87 + b;
  const blink = t % 4.3 < 0.13;
  g.save();
  g.strokeStyle = o.brow ?? 'rgba(90,64,40,0.85)';
  g.lineWidth = 0.85;
  g.lineCap = 'round';
  const lift = mood === 'waiting' ? 0.9 : 0;
  const worry = mood === 'trouble' ? 1 : 0;
  g.beginPath();
  g.moveTo(0.6, ey - 3 - lift + worry * 0.6);
  g.lineTo(4.2, ey - 3.6 - lift - worry * 0.6);
  g.stroke();
  g.beginPath();
  g.moveTo(6.3, ey - 3.7 - lift - worry * 0.6);
  g.lineTo(9.1, ey - 3.1 - lift + worry * 0.4);
  g.stroke();
  if (calm || blink) {
    g.strokeStyle = '#3a2a22';
    g.lineWidth = 0.8;
    g.beginPath();
    g.arc(2.6, ey - 0.3, 1.4, 0.15 * Math.PI, 0.85 * Math.PI);
    g.stroke();
    g.beginPath();
    g.arc(7.8, ey - 0.3, 1.2, 0.15 * Math.PI, 0.85 * Math.PI);
    g.stroke();
  } else {
    const r = mood === 'trouble' ? 1.15 : 1;
    oval(g, 2.6, ey, 1.25 * r, 1.65 * r, o.eye ?? '#2b3a2a');
    oval(g, 7.8, ey, 1.1 * r, 1.5 * r, o.eye ?? '#2b3a2a');
    oval(g, 3, ey - 0.6, 0.45, 0.45, '#ffffff');
    oval(g, 8.1, ey - 0.6, 0.4, 0.4, '#ffffff');
  }
  g.strokeStyle = 'rgba(160,100,80,0.7)';
  g.lineWidth = 0.6;
  g.beginPath();
  g.moveTo(10, -85 + b);
  g.lineTo(10.7, -82.6 + b);
  g.lineTo(9.7, -82.3 + b);
  g.stroke();
  if (mood === 'trouble') oval(g, 6.4, -79.4 + b, 0.9, 1.1, '#7a3b35');
  else {
    g.strokeStyle = '#a0584c';
    g.lineWidth = 0.7;
    g.beginPath();
    g.moveTo(5, -79.8 + b);
    g.quadraticCurveTo(6.4, -79 + b, 7.8, -79.8 + b);
    g.stroke();
  }
  g.restore();
  if (!o.hood) {
    shape(
      g,
      `M -8 ${-90 + b} C -7 ${-102 + b} 9 ${-103 + b} 11 ${-91 + b} C 7 ${-96 + b} 1 ${-97 + b} -3 ${-92 + b} C -4 ${-88 + b} -6 ${-86 + b} -8 ${-90 + b} Z`,
      hair[0],
    );
    line(
      g,
      [
        [-6.5, -92 + b],
        [-8, -84 + b],
        [-7, -77 + b],
      ],
      hair[1],
      1.8,
    );
    if (o.tie) {
      oval(g, -11, -94 + b, 3, 3, hair[1]);
      line(
        g,
        [
          [-12, -94 + b],
          [-16, -86 + b + sway * 0.3],
          [-17, -76 + b + sway * 0.4],
        ],
        hair[1],
        2.4,
      );
    }
  } else {
    shape(
      g,
      `M -9 ${-90 + b} C -8 ${-96 + b} 2 ${-98 + b} 9 ${-93 + b} C 4 ${-94 + b} -1 ${-93 + b} -5 ${-89 + b} Z`,
      hair[0],
    );
  }
  if (o.crown) {
    g.save();
    g.strokeStyle = o.trim;
    g.lineWidth = 1.1;
    g.beginPath();
    g.moveTo(-7.5, -93.5 + b);
    g.quadraticCurveTo(1, -97.5 + b, 10.5, -93 + b);
    g.stroke();
    g.restore();
    leaf(g, 2, -97 + b, 4, -2.2, o.trim);
    leaf(g, 6, -97.2 + b, 4, -0.9, o.trim);
    oval(g, 4, -96.3 + b, 1.3, 1.3, '#8ff0d2');
    glow(g, 4, -96.3 + b, 4, '#8ff0d2', 0.6);
  }
  g.restore();
  const hands: Hands = { back: lb.hand, front: lf.hand, b, sway };
  o.prop?.(g, hands);
  line(g, [SF, lf.elbow, lf.hand], o.sleeve?.[0] ?? robe[0], 5.4);
  g.save();
  g.strokeStyle = o.trim;
  g.lineWidth = 1;
  const cuff: Point = [lerp(lf.elbow[0], lf.hand[0], 0.78), lerp(lf.elbow[1], lf.hand[1], 0.78)];
  g.beginPath();
  g.arc(cuff[0], cuff[1], 2.7, 0, TAU);
  g.stroke();
  g.restore();
  oval(g, lf.hand[0], lf.hand[1], 2.6, 2.6, skin[0]);
  o.after?.(g, hands);
  g.restore();
  return [x + 2, ground0 - 100];
}

function end(
  g: Ctx,
  t: number,
  mood: AgentMood,
  head: Point,
  lights: readonly (readonly [number, number, number, string])[],
  trouble?: (g: Ctx) => void,
): void {
  motes(g, t, mood);
  finish(g, t, mood, {
    head,
    bubble: BUBBLE,
    z: Z,
    night: NIGHT,
    lights,
    afterDark: (gg) => motes(gg, t, mood),
    trouble: (gg) => {
      trouble?.(gg);
      dusk(gg, '#6a2a1a', 0.28);
    },
  });
}

const assistant: SmoothScene = (g, t, mood) => {
  forest(g, t, mood);
  trunk(g, 46, 36);
  const door = 'M 32 170 L 32 130 C 32 110 60 110 60 130 L 60 170 Z';
  shape(g, door, lin(g, 0, 112, 0, 170, '#ffe6a3', '#f2a34a', '#b8642a'), '#2a1d12', 2);
  glow(g, 46, 145, 34, '#ffc766', mood === 'idle' ? 0.6 : 0.35);
  ground(g, t);
  shape(g, 'M 112 176 C 118 166 182 166 190 176 Z', lin(g, 0, 166, 0, 176, '#7a6247', '#3e2f20'));
  const work = mood === 'working';
  const calm = mood === 'idle';
  const raise = work ? ease(0.5 + 0.5 * Math.sin(t * 1.5)) : mood === 'waiting' ? 0.3 : 0;
  const head = elf(g, 150, 172, t, mood, {
    robe: ['#f1f4e6', '#a9c39b'],
    cloak: ['#3f7d57', '#1e4932'],
    trim: '#d9b456',
    hair: ['#f4e7ba', '#c9b073'],
    crown: true,
    arms: { back: [0.2, -0.25], front: calm ? [0.35, -0.5] : [0.75 + raise, -0.75 - raise * 0.2] },
    prop: (gg, h) => {
      const [hx, hy] = h.front;
      const top: Point = [hx + 3, hy - 30 - raise * 4];
      const bottom: Point = [hx - 3, hy + 40 - raise * 4];
      line(gg, [bottom, h.front, top], lin(gg, 0, top[1], 0, bottom[1], '#9b7a4e', '#5b4024'), 2.4);
      gg.save();
      gg.strokeStyle = '#7d5d36';
      gg.lineWidth = 1.6;
      gg.lineCap = 'round';
      for (const s of [1, -1]) {
        gg.beginPath();
        gg.moveTo(top[0], top[1]);
        gg.bezierCurveTo(
          top[0] + 8 * s,
          top[1] - 4,
          top[0] + 7 * s,
          top[1] - 14,
          top[0] + s,
          top[1] - 13,
        );
        gg.stroke();
      }
      gg.restore();
      leaf(gg, top[0] + 4, top[1] - 4, 6, -0.5, '#6fae5a');
      leaf(gg, top[0] - 4, top[1] - 4, 6, -2.6, '#6fae5a');
      const c: Point = [top[0], top[1] - 8];
      glow(gg, c[0], c[1], 16 + raise * 8, '#9ff5d6', calm ? 0.3 : 0.7 + 0.3 * Math.sin(t * 4));
      shape(
        gg,
        `M ${c[0]} ${c[1] - 5} L ${c[0] + 3} ${c[1]} L ${c[0]} ${c[1] + 4} L ${c[0] - 3} ${c[1]} Z`,
        lin(gg, c[0] - 3, c[1] - 5, c[0] + 3, c[1] + 4, '#ffffff', '#8ff0d2', '#3fb592'),
      );
      if (work)
        for (let i = 0; i < 7; i++) {
          const p = (t * 0.32 + i / 7) % 1;
          const mx = c[0] + p * 135 + Math.sin(p * 9 + i) * 10 * p;
          const my = c[1] - p * 70 + Math.cos(p * 7 + i * 2) * 9 * p;
          gg.save();
          gg.globalAlpha = Math.sin(p * Math.PI);
          glow(gg, mx, my, 6, '#ffe58a', 0.8);
          leaf(gg, mx - 3, my, 6, t * 3 + i, '#ffe08a');
          gg.restore();
        }
    },
  });
  end(g, t, mood, head, [[46, 145, 34, '#ffc766']]);
};

const kitchen: SmoothScene = (g, t, mood) => {
  forest(g, t, mood);
  trunk(g, 268, 26);
  shape(
    g,
    'M -5 28 C 60 22 140 30 268 44 L 268 52 C 150 40 60 34 -5 38 Z',
    lin(g, 0, 22, 0, 52, '#7a5f42', '#3e2e1f'),
  );
  const herbs: Point[] = [
    [44, 33],
    [82, 33],
    [120, 36],
  ];
  herbs.forEach(([hx, hy], i) => {
    g.save();
    g.translate(hx, hy);
    g.rotate(Math.sin(t * 1.2 + i) * 0.08);
    line(
      g,
      [
        [0, 0],
        [0, 14],
      ],
      '#c9b48a',
      0.6,
    );
    for (let k = 0; k < 6; k++)
      leaf(
        g,
        0,
        14,
        8 + (k % 2) * 2,
        Math.PI / 2 + (k - 2.5) * 0.22,
        k % 2 ? '#6f9e4a' : '#8fb85c',
      );
    box(g, -2, 12, 4, 3, 1, '#b5523c');
    g.restore();
  });
  ground(g, t);
  shape(
    g,
    'M 76 174 L 78 148 L 112 148 L 114 174 Z',
    lin(g, 76, 0, 114, 0, '#4a3624', '#7a5c3f', '#4a3624'),
  );
  oval(g, 95, 148, 17, 3.6, '#a38461');
  shape(
    g,
    'M 84 143 C 85 150 105 150 106 143 Z',
    lin(g, 84, 0, 106, 0, '#9a6a3a', '#c48a50', '#8a5a2e'),
  );
  const berries: [number, number, string][] = [
    [89, 141.5, '#7b2d63'],
    [93, 140.6, '#c0304a'],
    [97, 141, '#7b2d63'],
    [101, 141.7, '#c0304a'],
    [95, 139.4, '#4b3a8c'],
  ];
  for (const [bx, by, c] of berries)
    oval(g, bx, by, 2.3, 2.3, rad(g, bx - 0.7, by - 0.8, 3, '#ffffff', c, c));
  const cx = 212;
  const floor = 174;
  fire(g, cx, floor - 2, t, mood);
  line(
    g,
    [
      [186, floor],
      [cx, 110],
    ],
    '#5a4128',
    2.2,
  );
  line(
    g,
    [
      [238, floor],
      [cx, 110],
    ],
    '#5a4128',
    2.2,
  );
  line(
    g,
    [
      [cx + 6, floor + 2],
      [cx, 110],
    ],
    '#4a3420',
    2,
  );
  line(
    g,
    [
      [cx, 110],
      [cx, 126],
    ],
    '#3a3a3a',
    0.8,
  );
  shape(
    g,
    'M 190 128 C 188 158 236 158 234 128 Z',
    lin(g, 190, 0, 234, 0, '#7a3a16', '#e39a5b', '#c06a32', '#5e2a10'),
  );
  oval(g, 200, 140, 2.2, 7, 'rgba(255,220,180,0.45)', 0.2);
  oval(g, cx, 128, 23, 4.6, lin(g, 189, 0, 235, 0, '#8a4a22', '#f0b07a', '#7a3a16'));
  oval(g, cx, 128.4, 20, 3.4, lin(g, 0, 125, 0, 131, '#9bc163', '#5f8a34'));
  const work = mood === 'working';
  const calm = mood === 'idle';
  if (!calm) {
    for (let i = 0; i < 3; i++) {
      const p = (t * 1.2 + i / 3) % 1;
      oval(g, cx - 10 + i * 9, 128, 1.6 * p, 0.9 * p, rgba('#d8f0a8', 1 - p));
    }
    steam(g, cx, 124, t);
  }
  const stir = work ? t * 3 : 0;
  const tip: Point = [cx - 8 + Math.cos(stir) * 7, 128.5 + Math.sin(stir) * 1.2];
  const head = elf(g, 160, floor, t, mood, {
    robe: ['#7a9a5a', '#3e5a33'],
    trim: '#c99a4a',
    hair: ['#c46a3a', '#8a3e1e'],
    tie: true,
    apron: ['#efe4c8', '#c8b88e'],
    sleeve: ['#5b7a44', '#3a5230'],
    brow: 'rgba(120,50,20,0.9)',
    arms: {
      back: { to: [-2, -55], bend: -1 },
      front: calm ? [0.3, -0.4] : { to: [tip[0] - 160 - 13, tip[1] - floor - 9], bend: -1 },
    },
    prop: (gg, h) => {
      if (calm) return;
      line(gg, [h.front, [tip[0] - 160, tip[1] - floor]], '#9a7444', 1.8);
      oval(gg, tip[0] - 160, tip[1] - floor, 2.8, 1.4, '#9a7444');
    },
    after: (gg, h) => {
      leaf(gg, h.back[0], h.back[1] - 1, 7, -1.9, '#7fb04e');
      leaf(gg, h.back[0] + 1, h.back[1] - 1, 6, -1.2, '#97c463');
    },
  });
  end(g, t, mood, head, [[cx, floor - 10, 30, '#ffae4a']], (gg) =>
    smoke(gg, cx, 112, t, '#3a3530'),
  );
};

function water(g: Ctx, t: number, mood: AgentMood, top: number): void {
  g.fillStyle = lin(g, 0, top, 0, 200, '#8cc1b0', '#3f7f86', '#21495a');
  g.fillRect(0, top, W, 200 - top);
  const speed = mood === 'working' ? 22 : 4;
  for (let i = 0; i < 22; i++) {
    const y = top + 3 + hash(i + 1) * (196 - top);
    const len = 6 + hash(i + 2) * 12;
    const x =
      ((((hash(i) * (W + 40) - t * speed * (0.6 + (y - top) / 60)) % (W + 40)) + W + 40) %
        (W + 40)) -
      20;
    line(
      g,
      [
        [x, y],
        [x + len, y],
      ],
      `rgba(255,255,240,${0.18 + 0.2 * Math.sin(t * 2 + i)})`,
      0.8,
    );
  }
}

function reeds(g: Ctx, x: number, y: number, t: number, n: number): void {
  for (let i = 0; i < n; i++) {
    const sx = x + i * 4;
    const h = 22 + hash(sx) * 16;
    const lean = Math.sin(t * 1.2 + i) * 2;
    g.save();
    g.strokeStyle = '#4a7a34';
    g.lineWidth = 1;
    g.beginPath();
    g.moveTo(sx, y);
    g.quadraticCurveTo(sx + lean * 0.3, y - h * 0.6, sx + lean, y - h);
    g.stroke();
    g.restore();
    if (i % 2 === 0) box(g, sx + lean - 1.4, y - h - 1, 2.8, 8, 1.4, '#7a4e2a');
  }
}

const travel: SmoothScene = (g, t, mood) => {
  forest(g, t, mood);
  shape(
    g,
    'M 0 132 C 80 126 200 136 300 128 L 300 148 L 0 148 Z',
    lin(g, 0, 126, 0, 148, '#5f8c45', '#34552a'),
  );
  fern(g, 40, 136, 18, -1.2, t);
  fern(g, 250, 132, 18, -1.9, t);
  water(g, t, mood, 146);
  reeds(g, 8, 166, t, 6);
  reeds(g, 262, 170, t, 7);
  const work = mood === 'working';
  const calm = mood === 'idle';
  const bob = Math.sin(t * 1.5) * 1.2;
  const push = work ? 0.5 + 0.5 * Math.sin(t * 1.6) : 0.3;
  const d: Point = [-0.42, 0.91];
  for (let i = 0; i < 3; i++) {
    const p = ((work ? t * 0.5 : t * 0.15) + i / 3) % 1;
    g.save();
    g.globalAlpha = 1 - p;
    g.strokeStyle = 'rgba(230,250,240,0.7)';
    g.lineWidth = 0.7;
    g.beginPath();
    g.ellipse(150, 170, 46 + p * 30, 5 + p * 4, 0, 0, TAU);
    g.stroke();
    g.restore();
  }
  if (work)
    for (let i = 0; i < 4; i++) {
      const p = (t * 0.6 + i / 4) % 1;
      line(
        g,
        [
          [102 - p * 50, 168 + p * 8],
          [90 - p * 50, 170 + p * 10],
        ],
        `rgba(240,255,250,${0.6 * (1 - p)})`,
        0.8,
      );
    }
  const floor = 174 + bob;
  const head = elf(g, 150, floor, t, mood, {
    robe: ['#8aa88a', '#3f5f4a'],
    cloak: ['#7a5a3a', '#4a3420'],
    trim: '#d9b456',
    hair: ['#e8d29a', '#b89a5a'],
    tie: true,
    sleeve: ['#6f8f6f', '#3f5f4a'],
    arms: calm
      ? { back: [0.2, -0.3], front: { to: [10, -58], bend: 1 } }
      : {
          front: { to: [12 - push * 6, -62 + push * 8], bend: 1 },
          back: { to: [12 - push * 6 + d[0] * -14, -62 + push * 8 + d[1] * -14], bend: 1 },
        },
    prop: (gg, h) => {
      const [hx, hy] = h.front;
      const top: Point = [hx - d[0] * 40, hy - d[1] * 40];
      const bottom: Point = [hx + d[0] * 70, hy + d[1] * 70];
      line(gg, [top, bottom], lin(gg, 0, top[1], 0, bottom[1], '#b08a56', '#6a4a2a'), 2);
    },
  });
  const hull = 'M 100 158 C 116 186 184 186 200 158 C 178 168 122 168 100 158 Z';
  g.save();
  g.translate(0, bob);
  shape(g, hull, lin(g, 0, 158, 0, 182, '#a8d46a', '#5f9a3a', '#3a6a24'));
  shape(g, 'M 100 158 C 122 168 178 168 200 158', null, '#cdea94', 1.2);
  shape(g, 'M 104 162 C 130 182 170 182 196 162', null, 'rgba(50,90,30,0.55)', 0.8);
  for (let i = 1; i < 8; i++) {
    const x = 104 + i * 12;
    line(
      g,
      [
        [x, 176 - Math.abs(150 - x) * 0.15],
        [x + 5, 168 - Math.abs(150 - x) * 0.1],
      ],
      'rgba(50,90,30,0.35)',
      0.6,
    );
  }
  shape(g, 'M 100 158 C 96 154 94 150 95 146 C 99 150 101 154 103 158 Z', '#7fb44e');
  shape(g, 'M 200 158 C 204 154 206 150 205 146 C 201 150 199 154 197 158 Z', '#7fb44e');
  g.restore();
  end(g, t, mood, head, []);
};

const observation: SmoothScene = (g, t, mood) => {
  forest(g, t, mood);
  trunk(g, 30, 22);
  ground(g, t);
  const work = mood === 'working';
  const calm = mood === 'idle';
  const hot = mood === 'trouble';
  const cx = 222;
  const cy = 146;
  shape(
    g,
    `M ${cx - 30} ${cy} L ${cx - 22} 176 L ${cx + 22} 176 L ${cx + 30} ${cy} Z`,
    lin(g, cx - 30, 0, cx + 30, 0, '#7a7a72', '#b4b2a4', '#6a6a62'),
  );
  for (let i = 0; i < 4; i++)
    line(
      g,
      [
        [cx - 26 + i * 15, cy + 4],
        [cx - 22 + i * 14, 175],
      ],
      'rgba(40,40,30,0.25)',
      0.7,
    );
  oval(g, cx - 16, 160, 6, 2.4, 'rgba(110,160,70,0.6)');
  oval(g, cx, cy, 36, 8.5, lin(g, cx - 36, 0, cx + 36, 0, '#8a887c', '#d2d0c2', '#7a786e'));
  const pool = lin(
    g,
    0,
    cy - 6,
    0,
    cy + 6,
    hot ? '#a0605a' : '#b8e6ff',
    hot ? '#4a2a30' : '#3a6a9a',
  );
  oval(g, cx, cy, 31, 6.2, pool);
  g.save();
  g.beginPath();
  g.ellipse(cx, cy, 31, 6.2, 0, 0, TAU);
  g.clip();
  for (let i = 0; i < 3; i++) {
    const p = ((work ? t * 0.45 : t * 0.1) + i / 3) % 1;
    g.strokeStyle = `rgba(255,255,255,${0.5 * (1 - p)})`;
    g.lineWidth = 0.7;
    g.beginPath();
    g.ellipse(cx + 4, cy, 4 + p * 30, 1 + p * 6, 0, 0, TAU);
    g.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const sx = cx - 22 + hash(i + 70) * 44;
    const sy = cy - 3 + hash(i + 71) * 6;
    glow(g, sx, sy, 3, '#ffffff', 0.4 + 0.5 * Math.abs(Math.sin(t * 2 + i)));
  }
  g.restore();
  glow(g, cx, cy - 4, 40, hot ? '#ff8a6a' : '#bfe8ff', calm ? 0.5 : 0.35 + 0.15 * Math.sin(t * 2));
  if (!calm)
    for (let i = 0; i < 6; i++) {
      const p = ((work ? t * 0.35 : t * 0.12) + i / 6) % 1;
      const mx = cx - 20 + hash(i + 80) * 40 + Math.sin(p * 6 + i) * 4;
      const my = cy - 4 - p * 60;
      glow(g, mx, my, 4, '#d8f4ff', Math.sin(p * Math.PI) * 0.9);
    }
  if (mood === 'waiting') {
    g.save();
    g.strokeStyle = rgba('#ffe08a', 0.5 + 0.4 * Math.sin(t * 4));
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(cx, cy, 14, 3, 0, 0, TAU);
    g.stroke();
    g.restore();
  }
  const reachX = work ? Math.sin(t * 1.2) * 4 : 0;
  const head = elf(g, 162, 174, t, mood, {
    robe: ['#7f93c8', '#2e3d72'],
    cloak: ['#3a4a86', '#1c2550'],
    trim: '#d8dcf0',
    hair: ['#e9ecf4', '#9aa0b8'],
    brow: 'rgba(120,124,150,0.9)',
    eye: '#2a3a6a',
    sleeve: ['#6c80b8', '#2e3d72'],
    arms: calm
      ? { back: [0.15, -0.2], front: [0.35, -0.35] }
      : { back: { to: [36 + reachX, -40], bend: 1 }, front: { to: [44 - reachX, -42], bend: 1 } },
    after: (gg, h) => {
      if (!calm) for (const [hx, hy] of [h.front, h.back]) glow(gg, hx, hy, 5, '#d8f4ff', 0.6);
    },
  });
  end(g, t, mood, head, [[cx, cy - 4, 36, '#bfe8ff']]);
};

const analysis: SmoothScene = (g, t, mood) => {
  forest(g, t, mood);
  trunk(g, 276, 22);
  ground(g, t);
  const work = mood === 'working';
  const calm = mood === 'idle';
  const hot = mood === 'trouble';
  g.save();
  g.strokeStyle = lin(g, 196, 0, 214, 0, '#3e2e1f', '#7a5f42', '#3e2e1f');
  g.lineWidth = 6;
  g.lineCap = 'round';
  g.beginPath();
  g.moveTo(200, 176);
  g.bezierCurveTo(212, 160, 196, 146, 207, 132);
  g.stroke();
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(203, 160);
  g.quadraticCurveTo(190, 158, 186, 170);
  g.stroke();
  g.beginPath();
  g.moveTo(206, 150);
  g.quadraticCurveTo(220, 152, 222, 162);
  g.stroke();
  g.restore();
  leaf(g, 222, 162, 6, 0.6, '#6fae4a');
  leaf(g, 186, 170, 6, 2.4, '#6fae4a');
  shape(
    g,
    'M 182 132 L 232 124 L 234 130 L 184 138 Z',
    lin(g, 0, 124, 0, 138, '#8a6a46', '#4e3a24'),
  );
  const left = 'M 186 130 Q 196 122 207 126 L 207 132 Q 196 128 186 136 Z';
  const right = 'M 207 126 Q 218 120 229 122 L 230 128 Q 218 126 207 132 Z';
  shape(g, left, lin(g, 186, 0, 207, 0, '#e8d8b0', '#f8eed4'));
  shape(g, right, lin(g, 207, 0, 230, 0, '#f8eed4', '#e2d0a2'));
  for (let i = 0; i < 4; i++) {
    line(
      g,
      [
        [189 + i * 0.4, 130 - i * 1.4 + 1],
        [204, 127.5 - i * 1.4 + 1],
      ],
      'rgba(90,70,40,0.4)',
      0.5,
    );
    line(
      g,
      [
        [210, 126.5 - i * 1.4 + 1],
        [226, 123.5 - i * 1.4 + 1],
      ],
      'rgba(90,70,40,0.4)',
      0.5,
    );
  }
  if (work) {
    const p = (t / 2.6) % 1;
    if (p < 0.5) {
      const a = (p / 0.5) * Math.PI;
      const tipX = 207 + Math.cos(a) * 22;
      const lift = Math.sin(a) * 10;
      shape(
        g,
        `M 207 126 Q ${lerp(207, tipX, 0.5)} ${122 - lift} ${tipX} ${123 - lift * 0.8} L ${tipX} ${129 - lift * 0.8} Q ${lerp(207, tipX, 0.5)} ${128 - lift} 207 132 Z`,
        rgba('#fffaea', 0.95),
        'rgba(120,90,50,0.4)',
        0.4,
      );
    }
  }
  const glowHex = hot ? '#ff8a6a' : '#ffe08a';
  glow(g, 207, 124, 24, glowHex, calm ? 0.2 : 0.45);
  const heights = [0.45, 0.7, 0.55, 0.9];
  heights.forEach((v, i) => {
    const x = 246 + i * 10;
    const grow = work ? 0.5 + 0.5 * Math.sin(t * 1.1 + i * 1.4) : v * (calm ? 0.4 : 1);
    const h = 8 + grow * 34;
    g.save();
    g.globalCompositeOperation = 'lighter';
    box(
      g,
      x,
      112 - h,
      6,
      h,
      2,
      lin(g, 0, 112 - h, 0, 112, rgba(glowHex, 0.75), rgba(glowHex, 0.1)),
    );
    g.restore();
    leaf(g, x + 3, 112 - h - 3, 5, -Math.PI / 2 - 0.4, rgba(glowHex, 0.9));
  });
  if (!calm)
    for (let i = 0; i < 5; i++) {
      const p = (t * 0.4 + i / 5) % 1;
      const x = lerp(212, 250 + (i % 4) * 10, p);
      const y = 120 - p * 30 - Math.sin(p * Math.PI) * 10;
      g.save();
      g.globalAlpha = Math.sin(p * Math.PI);
      g.strokeStyle = glowHex;
      g.shadowColor = glowHex;
      g.shadowBlur = 4;
      g.lineWidth = 0.8;
      g.beginPath();
      g.moveTo(x - 1.5, y - 2);
      g.lineTo(x, y + 2);
      g.lineTo(x + 1.5, y - 2);
      g.stroke();
      g.restore();
    }
  const head = elf(g, 154, 174, t, mood, {
    robe: ['#c9a25a', '#6e4c22'],
    cloak: ['#4a7a4a', '#24452a'],
    trim: '#efe0a8',
    hair: ['#3a3440', '#1e1a24'],
    brow: 'rgba(40,30,40,0.9)',
    sleeve: ['#b08a4a', '#6e4c22'],
    arms: {
      front: calm ? [0.35, -0.4] : { to: [44 + (work ? Math.sin(t * 1.2) * 3 : 0), -48], bend: 1 },
      back: { to: [12, -58], bend: -1 },
    },
    after: (gg, h) => {
      line(gg, [h.back, [h.back[0] + 6, h.back[1] - 9]], '#f4f0e0', 1);
      leaf(gg, h.back[0] + 4, h.back[1] - 6, 6, -1.1, '#f4f0e0');
    },
  });
  end(g, t, mood, head, [[207, 124, 24, '#ffe08a']]);
};

const coding: SmoothScene = (g, t, mood) => {
  forest(g, t, mood);
  ground(g, t);
  const work = mood === 'working';
  const calm = mood === 'idle';
  const hot = mood === 'trouble';
  const L = 206;
  const R = 278;
  const top = 72;
  const bottom = 150;
  for (const x of [L - 4, R + 4]) {
    shape(
      g,
      `M ${x - 3} 178 C ${x - 4} 140 ${x - 2} 100 ${x - 1} ${top - 8} L ${x + 2} ${top - 8} C ${x + 3} 100 ${x + 4} 140 ${x + 4} 178 Z`,
      lin(g, x - 4, 0, x + 4, 0, '#3e2e1f', '#7a6247', '#3e2e1f'),
    );
    leaf(g, x, top - 8, 7, -2, '#6fae4a');
    leaf(g, x, top - 8, 7, -1.1, '#8fc25a');
  }
  line(
    g,
    [
      [L - 8, top],
      [R + 8, top],
    ],
    '#6a4f36',
    3,
  );
  line(
    g,
    [
      [L - 8, bottom],
      [R + 8, bottom],
    ],
    '#6a4f36',
    3,
  );
  const threads = 13;
  for (let i = 0; i < threads; i++) {
    const x = L + 3 + (i * (R - L - 6)) / (threads - 1);
    line(
      g,
      [
        [x, top + 2],
        [x, bottom - 2],
      ],
      rgba('#bff5e2', calm ? 0.2 : 0.45),
      0.6,
    );
  }
  const palette = hot ? ['#ff7a6a', '#a04040'] : ['#9ff5d6', '#ffe08a', '#c9a0ff'];
  const rowsDone = work ? Math.floor((t * 1.6) % 17) : calm ? 9 : 12;
  for (let r = 0; r < rowsDone; r++) {
    const y = bottom - 4 - r * 4;
    const hex = palette[r % palette.length];
    for (let i = 0; i < threads - 1; i++) {
      if ((i + r) % 2) continue;
      const x = L + 3 + (i * (R - L - 6)) / (threads - 1);
      box(g, x, y - 1.3, (R - L - 6) / (threads - 1) + 0.6, 2.6, 1.3, rgba(hex, 0.85));
    }
  }
  const rowY = bottom - 4 - rowsDone * 4;
  const shuttle = L + 3 + ((Math.sin(t * 2.2) + 1) / 2) * (R - L - 6);
  if (!calm) {
    glow(g, shuttle, rowY, 10, '#bff5e2', 0.9);
    shape(
      g,
      `M ${shuttle - 7} ${rowY} Q ${shuttle} ${rowY - 3} ${shuttle + 7} ${rowY} Q ${shuttle} ${rowY + 3} ${shuttle - 7} ${rowY} Z`,
      '#f6f0d8',
    );
  }
  const head = elf(g, 162, 174, t, mood, {
    robe: ['#a0c8b0', '#3e6a5a'],
    cloak: ['#6a4a8a', '#352450'],
    trim: '#e8d6ff',
    hair: ['#b8d8e8', '#6a8ca0'],
    crown: true,
    sleeve: ['#8ab8a0', '#3e6a5a'],
    arms: calm
      ? { back: [0.15, -0.2], front: [0.35, -0.4] }
      : {
          front: { to: [28 + Math.sin(t * 2.2) * 3, -62 + Math.cos(t * 2.2) * 3], bend: 1 },
          back: { to: [24, -46 + Math.sin(t * 2.2 + 1) * 3], bend: 1 },
        },
    after: (gg, h) => {
      if (calm) return;
      const target: Point = [shuttle - 162, rowY - 174];
      gg.save();
      gg.setLineDash([2, 3]);
      gg.lineDashOffset = -t * 12;
      line(gg, [h.front, target], rgba('#bff5e2', 0.6), 0.7);
      gg.restore();
      glow(gg, h.front[0], h.front[1], 5, '#bff5e2', 0.7);
    },
  });
  end(g, t, mood, head, []);
};

const security: SmoothScene = (g, t, mood) => {
  forest(g, t, mood);
  ground(g, t);
  const work = mood === 'working';
  const calm = mood === 'idle';
  const hot = mood === 'trouble';
  g.save();
  g.translate(-22, 0);
  shape(
    g,
    'M 228 178 C 230 140 226 100 246 80 C 254 72 262 70 266 70 L 266 77 C 258 78 252 84 248 90 C 240 104 242 140 244 178 Z',
    lin(g, 226, 0, 246, 0, '#3a2c1f', '#6e5640', '#3a2c1f'),
  );
  shape(
    g,
    'M 300 178 C 298 140 300 104 286 88 C 280 80 272 77 266 77 L 266 70 C 276 70 286 74 292 82 C 306 100 308 140 312 178 Z',
    lin(g, 282, 0, 302, 0, '#3a2c1f', '#6e5640', '#3a2c1f'),
  );
  for (let i = 0; i < 9; i++) {
    const a = Math.PI + (i / 8) * Math.PI;
    const gx = 268 + Math.cos(a) * 30;
    const gy = 112 + Math.sin(a) * 40;
    const lit = work ? Math.max(0, Math.sin(t * 2 - i * 0.6)) : calm ? 0.2 : 0.4;
    g.save();
    g.globalAlpha = 0.3 + lit * 0.7;
    g.strokeStyle = hot ? '#ff7a6a' : '#ffe08a';
    g.lineWidth = 0.9;
    g.shadowColor = '#ffe08a';
    g.shadowBlur = 4 * lit;
    g.beginPath();
    g.moveTo(gx - 1.5, gy - 2);
    g.lineTo(gx, gy + 2);
    g.lineTo(gx + 1.5, gy - 2);
    g.stroke();
    g.restore();
  }
  for (let i = 0; i < 14; i++) {
    const a = Math.PI * 1.05 + (i / 13) * Math.PI * 0.9;
    leaf(
      g,
      268 + Math.cos(a) * 36,
      116 + Math.sin(a) * 46,
      5,
      a + 1.4,
      i % 2 ? '#6fae4a' : '#4e8a3a',
    );
  }
  line(
    g,
    [
      [266, 74],
      [266, 92],
    ],
    '#3a3a2a',
    0.6,
  );
  glow(g, 266, 98, 20, '#ffd27a', calm ? 0.9 : 0.5);
  shape(g, 'M 262 92 L 270 92 L 271 104 L 261 104 Z', 'rgba(255,214,130,0.85)', '#4a3a24', 0.8);
  const ox = 256;
  const oy = 62;
  const shut = t % 3.1 < 0.15 || calm;
  oval(g, ox, oy + 2, 8, 10, lin(g, 0, oy - 8, 0, oy + 12, '#9a7a56', '#5e4630'));
  shape(
    g,
    `M ${ox - 7} ${oy - 6} L ${ox - 5} ${oy - 11} L ${ox - 2} ${oy - 7} Z M ${ox + 7} ${oy - 6} L ${ox + 5} ${oy - 11} L ${ox + 2} ${oy - 7} Z`,
    '#6e5236',
  );
  oval(g, ox - 3.2, oy - 2, 3.4, 3.4, '#e9d9b8');
  oval(g, ox + 3.2, oy - 2, 3.4, 3.4, '#e9d9b8');
  if (shut) {
    line(
      g,
      [
        [ox - 5, oy - 2],
        [ox - 1.5, oy - 2],
      ],
      '#3a2a1a',
      0.8,
    );
    line(
      g,
      [
        [ox + 1.5, oy - 2],
        [ox + 5, oy - 2],
      ],
      '#3a2a1a',
      0.8,
    );
  } else {
    for (const s of [-1, 1]) {
      oval(g, ox + s * 3.2, oy - 2, 1.7, 1.7, '#1a1a12');
      oval(g, ox + s * 3.2 + 0.5, oy - 2.6, 0.5, 0.5, '#ffffff');
    }
  }
  shape(g, `M ${ox - 1} ${oy + 0.5} L ${ox + 1} ${oy + 0.5} L ${ox} ${oy + 2.5} Z`, '#d9a441');
  g.restore();
  const cyc = (t / 3) % 1;
  const pull = work
    ? cyc < 0.45
      ? ease(cyc / 0.45)
      : cyc < 0.5
        ? 1
        : Math.max(0, 1 - (cyc - 0.5) * 6)
    : mood === 'waiting'
      ? 0.35
      : 0;
  const flying = work && cyc >= 0.5 && cyc < 0.8;
  const aim = !calm;
  const head = elf(g, 120, 174, t, mood, {
    robe: ['#5c7a4a', '#2f4a2c'],
    cloak: ['#2f5a3c', '#183324'],
    hood: true,
    trim: '#c7a35a',
    hair: ['#3a2a22', '#21160f'],
    sleeve: ['#4a6a3c', '#2f4a2c'],
    eye: '#3a5a4a',
    arms: {
      front: aim ? [1.55, -0.05] : [0.35, -0.15],
      back: aim ? { to: [lerp(25, 10, pull), lerp(-70, -80, pull)], bend: 1 } : [0.15, -0.2],
    },
    after: (gg, h) => {
      const [hx, hy] = h.front;
      const bend = 6 + pull * 3;
      const tipA: Point = [hx - 3 - pull * 2, hy - 24];
      const tipB: Point = [hx - 3 - pull * 2, hy + 24];
      gg.save();
      gg.strokeStyle = lin(gg, 0, tipA[1], 0, tipB[1], '#8a6a3e', '#c9a05a', '#8a6a3e');
      gg.lineWidth = 2.2;
      gg.lineCap = 'round';
      gg.beginPath();
      gg.moveTo(tipA[0], tipA[1]);
      gg.quadraticCurveTo(hx + bend, hy, tipB[0], tipB[1]);
      gg.stroke();
      gg.restore();
      const nock: Point = aim ? h.back : [hx - 3, hy];
      line(gg, [tipA, nock, tipB], 'rgba(240,235,210,0.8)', 0.5);
      if (aim && !flying) {
        const tip: Point = [hx + 8, hy - (hy - nock[1]) * 0.05];
        line(gg, [nock, tip], '#d8c49a', 1);
        shape(
          gg,
          `M ${tip[0]} ${tip[1] - 2} L ${tip[0] + 5} ${tip[1]} L ${tip[0]} ${tip[1] + 2} Z`,
          '#cfe9e0',
        );
        glow(gg, tip[0] + 2, tip[1], 5 + pull * 4, '#bff5e2', 0.5 + pull * 0.5);
        leaf(gg, nock[0] + 1, nock[1], 4, 2.8, '#d9b456');
        leaf(gg, nock[0] + 1, nock[1], 4, -2.8 + TAU, '#d9b456');
      }
      if (flying) {
        const p = (cyc - 0.5) / 0.3;
        const fx = hx + 8 + p * 200;
        const fy = hy - 1;
        gg.save();
        gg.globalAlpha = 1 - p * 0.5;
        line(
          gg,
          [
            [fx - 40, fy],
            [fx, fy],
          ],
          lin(gg, fx - 40, 0, fx, 0, 'rgba(191,245,226,0)', 'rgba(220,255,240,0.95)'),
          1.6,
        );
        glow(gg, fx, fy, 9, '#bff5e2', 1);
        gg.restore();
      }
    },
  });
  end(g, t, mood, head, [[244, 98, 22, '#ffd27a']]);
};

export const SYLVAN: Readonly<Record<string, SmoothScene>> = {
  assistant,
  kitchen,
  travel,
  observation,
  analysis,
  coding,
  security,
};
