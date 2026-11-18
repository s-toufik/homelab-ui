import type { AgentMood } from '../../../domain/agent-activity';
import {
  TAU,
  W,
  box,
  finish,
  fire,
  glow,
  hash,
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

const BUBBLE: BubbleStyle = { paper: '#f3e6c4', ink: '#5a3412', edge: '#a07a3a' };
const NIGHT = '#1a1838';
const Z = '#ffe6b8';
const FLOOR = 176;
const GOLD = '#e2b54e';

function hall(g: Ctx, t: number, pillars: readonly number[] = [14]): void {
  g.fillStyle = lin(g, 0, 0, 0, 165, '#1f1916', '#3b2f28');
  g.fillRect(0, 0, W, 200);
  for (let r = 0; r < 10; r++) {
    const y = r * 17 - 6;
    const off = r % 2 ? 0 : 19;
    for (let c = -1; c < 9; c++) {
      const x = c * 38 + off;
      const v = hash(r * 13 + c);
      box(
        g,
        x + 1.2,
        y + 1.2,
        35.6,
        14.6,
        3.5,
        `rgba(${96 + v * 30},${76 + v * 20},${62 + v * 14},${0.32 + v * 0.16})`,
      );
      line(
        g,
        [
          [x + 4, y + 2],
          [x + 33, y + 2],
        ],
        'rgba(255,220,180,0.05)',
        0.6,
      );
    }
  }
  vignette(g);
  for (const px of pillars) {
    shape(
      g,
      `M ${px - 11} 0 L ${px + 11} 0 L ${px + 11} 164 L ${px - 11} 164 Z`,
      lin(g, px - 11, 0, px + 11, 0, '#2a211c', '#6a574a', '#4a3c33', '#211a16'),
    );
    for (const by of [26, 150])
      box(
        g,
        px - 13,
        by,
        26,
        5,
        1.5,
        lin(g, px - 13, 0, px + 13, 0, '#7a5a20', '#e8c060', '#8a6420'),
      );
  }
  floor(g);
  dust(g, t);
}

function vignette(g: Ctx): void {
  const v = g.createRadialGradient(150, 90, 40, 150, 90, 200);
  v.addColorStop(0, 'rgba(0,0,0,0)');
  v.addColorStop(1, 'rgba(0,0,0,0.55)');
  g.fillStyle = v;
  g.fillRect(0, 0, W, 200);
}

function floor(g: Ctx): void {
  shape(g, 'M 0 164 L 300 164 L 300 200 L 0 200 Z', lin(g, 0, 164, 0, 200, '#4c3f36', '#1e1814'));
  g.save();
  g.strokeStyle = 'rgba(0,0,0,0.3)';
  g.lineWidth = 0.7;
  for (const y of [172, 184, 199]) {
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  for (let i = -6; i <= 6; i++) {
    g.beginPath();
    g.moveTo(150 + i * 26, 164);
    g.lineTo(150 + i * 46, 200);
    g.stroke();
  }
  g.restore();
  line(
    g,
    [
      [0, 164.5],
      [300, 164.5],
    ],
    'rgba(255,210,150,0.18)',
    1,
  );
}

function dust(g: Ctx, t: number): void {
  for (let i = 0; i < 10; i++) {
    const x = (hash(i + 60) * W + t * 3 * (0.5 + hash(i))) % W;
    const y = 20 + hash(i + 61) * 130 + Math.sin(t * 0.8 + i) * 6;
    oval(g, x, y, 0.7, 0.7, `rgba(255,220,160,${0.2 + 0.3 * Math.abs(Math.sin(t + i))})`);
  }
}

function lantern(g: Ctx, x: number, y: number, t: number, mood: AgentMood, hung = true): void {
  if (hung)
    line(
      g,
      [
        [x, 0],
        [x, y - 9],
      ],
      '#3a3028',
      0.8,
    );
  const f = mood === 'idle' ? 0.55 : 0.75 + 0.1 * Math.sin(t * 7) + 0.06 * Math.sin(t * 13);
  glow(g, x, y, 46, '#ffb85a', f * 0.6);
  shape(
    g,
    `M ${x - 5} ${y - 9} L ${x + 5} ${y - 9} L ${x + 7} ${y - 6} L ${x - 7} ${y - 6} Z`,
    '#b98a3a',
  );
  shape(
    g,
    `M ${x - 6} ${y - 6} L ${x + 6} ${y - 6} L ${x + 5} ${y + 7} L ${x - 5} ${y + 7} Z`,
    lin(g, 0, y - 6, 0, y + 7, '#fff1b8', '#ffc65a'),
  );
  line(
    g,
    [
      [x - 6, y - 6],
      [x - 5, y + 7],
    ],
    '#8a6a2a',
    1,
  );
  line(
    g,
    [
      [x + 6, y - 6],
      [x + 5, y + 7],
    ],
    '#8a6a2a',
    1,
  );
  line(
    g,
    [
      [x, y - 6],
      [x, y + 7],
    ],
    'rgba(138,106,42,0.6)',
    0.6,
  );
  shape(
    g,
    `M ${x - 6} ${y + 7} L ${x + 6} ${y + 7} L ${x + 3} ${y + 10} L ${x - 3} ${y + 10} Z`,
    '#8a6a2a',
  );
}

type Pair = readonly [string, string];

interface Dwarf {
  readonly tunic: Pair;
  readonly beard: Pair;
  readonly arms: { readonly back: ArmSpec; readonly front: ArmSpec };
  readonly helm?: 'iron' | 'crown' | 'cap';
  readonly cap?: readonly [string, string, string];
  readonly hairColor?: string;
  readonly brows?: string;
  readonly skin?: Pair;
  readonly legs?: string;
  readonly cape?: Pair;
  readonly apron?: Pair;
  readonly mail?: boolean;
  readonly glasses?: boolean;
  readonly flip?: boolean;
  readonly prop?: (g: Ctx, h: Hands) => void;
  readonly after?: (g: Ctx, h: Hands) => void;
}

function dwarf(g: Ctx, x: number, ground: number, t: number, mood: AgentMood, o: Dwarf): Point {
  g.save();
  g.translate(x, ground);
  if (o.flip) g.scale(-1, 1);
  const calm = mood === 'idle';
  const b = Math.sin(t * 1.6) * 0.5;
  const skin = o.skin ?? ['#f2c7a5', '#d39a78'];
  const beard = o.beard;
  const tunic = o.tunic;
  const SB: Point = [-9, -42 + b];
  const SF: Point = [8, -42 + b];
  const lb = pose(SB, o.arms.back, 11, 11);
  const lf = pose(SF, o.arms.front, 11, 11);
  const hands: Hands = { back: lb.hand, front: lf.hand, b, sway: 0 };
  if (o.cape)
    shape(
      g,
      `M -12 ${-44 + b} C -20 -30 -22 -14 -21 -2 L 10 -2 C 6 -16 4 -30 10 ${-44 + b} Z`,
      lin(g, -20, -44, 8, 0, o.cape[0], o.cape[1]),
    );
  line(g, [SB, lb.elbow, lb.hand], tunic[1], 7.6);
  oval(g, lb.hand[0], lb.hand[1], 3.6, 3.6, '#6a4428');
  g.beginPath();
  g.roundRect(-10, -19, 8.5, 13, 2);
  g.roundRect(1.5, -19, 8.5, 13, 2);
  g.fillStyle = o.legs ?? '#3b3029';
  g.fill();
  shape(
    g,
    'M -12 -6.5 L -2 -6.5 L -1.5 0 L -14 0 C -14 -3 -13.4 -5.4 -12 -6.5 Z',
    lin(g, 0, -7, 0, 0, '#5a3a22', '#25160c'),
  );
  shape(
    g,
    'M 1 -6.5 L 10 -6.5 C 13.5 -5.6 15.5 -3 15.5 0 L 1 0 Z',
    lin(g, 0, -7, 0, 0, '#5a3a22', '#25160c'),
  );
  const torso = shape(
    g,
    `M -15 ${-38 + b} C -18.5 -28 -17 -18 -13 -13 L 13 -13 C 17 -18 18.5 -28 15 ${-38 + b} C 10 ${-46 + b} -10 ${-46 + b} -15 ${-38 + b} Z`,
    lin(g, -16, -45, 16, -13, tunic[0], tunic[1]),
  );
  if (o.mail) {
    g.save();
    g.clip(torso);
    g.strokeStyle = 'rgba(255,255,255,0.18)';
    g.lineWidth = 0.6;
    for (let ry = -44; ry < -12; ry += 3)
      for (let rx = -18 + ((ry / 3) % 2 ? 1.5 : 0); rx < 18; rx += 3) {
        g.beginPath();
        g.arc(rx, ry, 1.5, 0, Math.PI);
        g.stroke();
      }
    g.restore();
  }
  if (o.apron)
    shape(
      g,
      'M -10 -34 L 10 -34 L 12 -8 C 4 -6 -4 -6 -12 -8 Z',
      lin(g, 0, -34, 0, -8, o.apron[0], o.apron[1]),
    );
  box(g, -16.5, -21.5, 33, 5.2, 2, '#3a2516');
  g.beginPath();
  g.roundRect(-0.5, -22.6, 7, 7.4, 1.4);
  g.strokeStyle = GOLD;
  g.lineWidth = 1.7;
  g.stroke();
  const hy = -52 + b;
  g.save();
  g.translate(1, -44 + b);
  g.rotate(calm ? 0.14 : mood === 'waiting' ? -0.07 : 0);
  g.translate(-1, 44 - b);
  if (o.hairColor)
    shape(
      g,
      `M -9 ${hy - 4} C -12 ${hy + 2} -11 ${hy + 8} -8 ${hy + 10} L -4 ${hy} Z`,
      o.hairColor,
    );
  oval(g, -6.6, hy, 2.4, 3.4, skin[1]);
  oval(g, 2, hy, 9.2, 8.6, lin(g, 10, hy - 8, -6, hy + 8, skin[0], skin[1]));
  const blink = t % 4.7 < 0.13;
  const lift = mood === 'waiting' ? 1 : 0;
  const worry = mood === 'trouble' ? 1 : 0;
  if (calm || blink) {
    g.save();
    g.strokeStyle = '#3a2418';
    g.lineWidth = 0.8;
    g.beginPath();
    g.arc(1.8, hy - 2.6, 1.3, 0.15 * Math.PI, 0.85 * Math.PI);
    g.stroke();
    g.beginPath();
    g.arc(6.9, hy - 2.8, 1.2, 0.15 * Math.PI, 0.85 * Math.PI);
    g.stroke();
    g.restore();
  } else {
    oval(g, 1.8, hy - 2.8, 1.1, 1.35, '#2a1a12');
    oval(g, 6.9, hy - 3, 1, 1.25, '#2a1a12');
    oval(g, 2.2, hy - 3.3, 0.4, 0.4, '#ffffff');
    oval(g, 7.2, hy - 3.5, 0.35, 0.35, '#ffffff');
  }
  if (o.glasses) {
    g.save();
    g.strokeStyle = '#c9a24a';
    g.lineWidth = 0.7;
    g.beginPath();
    g.arc(1.8, hy - 2.8, 2.4, 0, TAU);
    g.moveTo(9.3, hy - 3);
    g.arc(6.9, hy - 3, 2.4, 0, TAU);
    g.moveTo(4.2, hy - 3);
    g.lineTo(4.5, hy - 3);
    g.stroke();
    g.restore();
  }
  const browColor = o.brows ?? beard[0];
  line(
    g,
    [
      [-1, hy - 5.6 - lift + worry],
      [4, hy - 6.4 - lift - worry],
    ],
    browColor,
    1.9,
  );
  line(
    g,
    [
      [5.4, hy - 6.5 - lift - worry],
      [9.6, hy - 5.6 - lift + worry * 0.6],
    ],
    browColor,
    1.9,
  );
  const sw = Math.sin(t * 1.3) * 0.8;
  const bd = shape(
    g,
    `M -8 ${hy + 0.5} C -11.5 ${hy + 12} -9 ${hy + 24} ${-1 + sw} ${hy + 33} C 1 ${hy + 30} 3 ${hy + 30} ${5 + sw} ${hy + 33} C 12.5 ${hy + 24} 15 ${hy + 12} 12 ${hy + 0.5} C 9 ${hy + 6} 3 ${hy + 7.5} -2 ${hy + 5} C -5 ${hy + 4} -7 ${hy + 2.5} -8 ${hy + 0.5} Z`,
    lin(g, 0, hy, 4, hy + 33, beard[0], beard[1]),
  );
  g.save();
  g.clip(bd);
  g.strokeStyle = 'rgba(0,0,0,0.14)';
  g.lineWidth = 0.7;
  for (let i = 0; i < 6; i++) {
    const sx = -6 + i * 3.4;
    g.beginPath();
    g.moveTo(sx, hy + 6);
    g.quadraticCurveTo(sx + 1.5, hy + 18, sx + 0.5 + sw, hy + 32);
    g.stroke();
  }
  g.restore();
  oval(g, -1 + sw, hy + 33.5, 1.8, 1.4, GOLD);
  oval(g, 5 + sw, hy + 33.5, 1.8, 1.4, GOLD);
  if (mood === 'trouble') oval(g, 4.2, hy + 5.4, 1.5, 1.3, '#4a1e16');
  shape(
    g,
    `M 6 ${hy + 2} C 2 ${hy + 1} -2 ${hy + 4} -4 ${hy + 8.5} C -1 ${hy + 6} 3 ${hy + 5} 6.5 ${hy + 4.2} Z`,
    beard[0],
  );
  shape(
    g,
    `M 7 ${hy + 2} C 11 ${hy + 1} 14 ${hy + 4} 15.5 ${hy + 8.5} C 12 ${hy + 6} 9 ${hy + 5} 6.5 ${hy + 4.2} Z`,
    beard[0],
  );
  oval(g, 9, hy - 0.4, 3.7, 3.2, rad(g, 8.2, hy - 1.5, 4.5, '#f6b898', '#d27a5e'));
  if (o.helm === 'iron') {
    shape(
      g,
      `M -9.5 ${hy - 4} C -9.5 ${hy - 18} 12.5 ${hy - 18} 12.5 ${hy - 4} Z`,
      lin(g, -8, hy - 16, 10, hy - 4, '#e3e8ee', '#8a94a2', '#4a515b'),
    );
    box(g, -10.5, hy - 6.5, 24, 3.6, 1.4, '#5b636e');
    box(g, 7.6, hy - 6.5, 2.2, 7.5, 1, '#7a838e');
    for (const rx of [-7, -2, 3]) oval(g, rx, hy - 4.7, 0.7, 0.7, '#cfd5dc');
    oval(g, -3, hy - 13, 3, 1.4, 'rgba(255,255,255,0.6)', -0.4);
  } else if (o.helm === 'crown') {
    shape(
      g,
      `M -9 ${hy - 4} C -9 ${hy - 13} 12 ${hy - 13} 12 ${hy - 4} Z`,
      o.hairColor ?? beard[0],
    );
    shape(
      g,
      `M -9.5 ${hy - 5} L -9 ${hy - 11} L -5.5 ${hy - 8} L -2 ${hy - 14} L 1.5 ${hy - 8.5} L 5 ${hy - 14.5} L 8.5 ${hy - 8.5} L 12 ${hy - 11.5} L 12.5 ${hy - 5} Z`,
      lin(g, -9, hy - 14, 12, hy - 5, '#fff0b0', GOLD, '#9a6a1e'),
    );
    oval(g, 1.5, hy - 6.6, 1.5, 1.5, '#c8243a');
    oval(g, 1.1, hy - 7.1, 0.5, 0.5, '#ffd0d6');
  } else if (o.helm === 'cap') {
    const cap = o.cap ?? ['#8a6a44', '#4e3a24', '#6a5034'];
    shape(
      g,
      `M -9.5 ${hy - 3} C -10 ${hy - 14} 10 ${hy - 16} 12.5 ${hy - 4} Z`,
      lin(g, -8, hy - 15, 10, hy - 3, cap[0], cap[1]),
    );
    g.save();
    g.strokeStyle = 'rgba(30,20,10,0.35)';
    g.lineWidth = 0.6;
    for (let k = -6; k <= 9; k += 3) {
      g.beginPath();
      g.moveTo(k, hy - 6);
      g.lineTo(k + 0.8, hy - 13);
      g.stroke();
    }
    g.restore();
    box(g, -10.5, hy - 6, 24, 4, 2, cap[2]);
  }
  g.restore();
  o.prop?.(g, hands);
  line(g, [SF, lf.elbow, lf.hand], tunic[0], 7.6);
  oval(g, lf.hand[0], lf.hand[1], 3.6, 3.6, '#7a4e2e');
  o.after?.(g, hands);
  g.restore();
  return [x + (o.flip ? -2 : 2), ground - 70];
}

function end(
  g: Ctx,
  t: number,
  mood: AgentMood,
  head: Point,
  lights: readonly (readonly [number, number, number, string])[],
  trouble: (g: Ctx) => void,
): void {
  finish(g, t, mood, { head, bubble: BUBBLE, z: Z, night: NIGHT, lights, trouble });
}

const assistant: SmoothScene = (g, t, mood) => {
  hall(g, t);
  lantern(g, 92, 36, t, mood);
  const mx = 176;
  const my = 46;
  const mw = 106;
  const mh = 82;
  box(
    g,
    mx - 5,
    my - 5,
    mw + 10,
    mh + 10,
    4,
    lin(g, mx, my, mx + mw, my + mh, '#6a574a', '#3a2e26'),
  );
  box(g, mx, my, mw, mh, 2, lin(g, mx, my, mx + mw, my + mh, '#f0e0b4', '#d8bf86', '#c2a46a'));
  for (const rx of [mx - 2, mx + mw - 6])
    box(g, rx, my - 3, 8, mh + 6, 4, lin(g, rx, 0, rx + 8, 0, '#b89a62', '#efdcae', '#a4864e'));
  const peaks: [number, number, number][] = [
    [196, 82, 12],
    [214, 72, 15],
    [236, 78, 12],
    [258, 70, 14],
  ];
  for (const [px, py, s] of peaks) {
    shape(
      g,
      `M ${px - s} ${py + s * 0.8} L ${px} ${py - s * 0.4} L ${px + s} ${py + s * 0.8}`,
      null,
      '#6a4a2a',
      1,
    );
    shape(
      g,
      `M ${px - 3} ${py + 0.6} L ${px} ${py - s * 0.4} L ${px + 3} ${py + 0.6}`,
      'rgba(255,255,255,0.6)',
    );
  }
  shape(
    g,
    'M 182 112 C 200 104 214 118 236 108 C 252 101 262 114 278 106',
    null,
    'rgba(70,110,150,0.7)',
    1.6,
  );
  const nodes: Point[] = [
    [190, 120],
    [214, 98],
    [242, 94],
    [266, 86],
    [228, 70],
  ];
  const work = mood === 'working';
  g.save();
  g.setLineDash([2, 2.5]);
  line(g, nodes.slice(0, 4), 'rgba(110,60,25,0.75)', 1);
  line(g, [nodes[2], nodes[4]], 'rgba(110,60,25,0.75)', 1);
  g.restore();
  for (const [nx, ny] of [nodes[1], nodes[3], nodes[4]])
    shape(
      g,
      `M ${nx - 4} ${ny + 3} L ${nx - 4} ${ny} C ${nx - 4} ${ny - 4} ${nx + 4} ${ny - 4} ${nx + 4} ${ny} L ${nx + 4} ${ny + 3} Z`,
      '#3a2414',
    );
  const seq = (t * 0.45) % 1;
  const legs: [Point, Point][] = [
    [nodes[0], nodes[1]],
    [nodes[1], nodes[2]],
    [nodes[2], nodes[3]],
    [nodes[2], nodes[4]],
  ];
  const k = Math.min(legs.length - 1, Math.floor(seq * legs.length));
  if (work) {
    const p = (seq * legs.length) % 1;
    for (let i = 0; i < k; i++) {
      g.save();
      g.shadowColor = '#ffcf5a';
      g.shadowBlur = 6;
      line(g, legs[i], 'rgba(230,170,40,0.9)', 1.4);
      g.restore();
    }
    const [a, z] = legs[k];
    const sx = lerp(a[0], z[0], p);
    const sy = lerp(a[1], z[1], p);
    line(g, [a, [sx, sy]], 'rgba(230,170,40,0.9)', 1.4);
    glow(g, sx, sy, 8, '#ffd76a', 1);
  }
  const pointAt: Point | null = work ? legs[k][1] : mood === 'waiting' ? nodes[3] : null;
  const x0 = 140;
  const head = dwarf(g, x0, FLOOR, t, mood, {
    tunic: ['#3b5a94', '#1e3262'],
    cape: ['#8a2328', '#4a1014'],
    beard: ['#f4f1ea', '#b9b2a6'],
    hairColor: '#e6e1d6',
    brows: '#efeae0',
    helm: 'crown',
    legs: '#2a2a36',
    arms: {
      back: { to: [-4, -24], bend: -1 },
      front: pointAt ? { to: [22, -48], bend: 1 } : [0.35, -0.3],
    },
    prop: (gg, h) => {
      if (!pointAt) {
        line(
          gg,
          [
            [h.front[0] + 1, h.front[1] + 22],
            [h.front[0] - 1, h.front[1] - 26],
          ],
          '#6a4a2a',
          2,
        );
        oval(gg, h.front[0] - 1, h.front[1] - 27, 2.2, 2.2, GOLD);
        return;
      }
      const tip: Point = [pointAt[0] - x0, pointAt[1] - FLOOR];
      const dx = tip[0] - h.front[0];
      const dy = tip[1] - h.front[1];
      const d = Math.hypot(dx, dy) || 1;
      const endPoint: Point = [h.front[0] + (dx / d) * (d - 2), h.front[1] + (dy / d) * (d - 2)];
      line(gg, [[h.front[0] - (dx / d) * 6, h.front[1] - (dy / d) * 6], endPoint], '#6a4a2a', 2);
      oval(gg, endPoint[0], endPoint[1], 2.2, 2.2, GOLD);
    },
  });
  end(g, t, mood, head, [[92, 36, 40, '#ffb85a']], (gg) => smoke(gg, 230, 70, t));
};

const kitchen: SmoothScene = (g, t, mood) => {
  hall(g, t);
  lantern(g, 120, 30, t, mood);
  shape(g, 'M 34 64 C 60 76 86 76 112 64', null, '#5a3a26', 0.8);
  for (let i = 0; i < 7; i++) {
    const p = i / 6;
    const sx = lerp(38, 108, p);
    const sy = 64 + Math.sin(p * Math.PI) * 11 + 3;
    oval(
      g,
      sx,
      sy + 4,
      3.2,
      5.2,
      lin(g, sx - 3, sy, sx + 3, sy + 8, '#b8573a', '#7a2f1e'),
      0.15 * Math.sin(t + i),
    );
  }
  box(g, 40, 138, 62, 5, 1.5, lin(g, 0, 138, 0, 143, '#8a6040', '#5a3a24'));
  line(
    g,
    [
      [46, 143],
      [46, 164],
    ],
    '#4a301c',
    3,
  );
  line(
    g,
    [
      [96, 143],
      [96, 164],
    ],
    '#4a301c',
    3,
  );
  shape(
    g,
    'M 52 138 L 52 126 C 52 124 62 124 62 126 L 62 138 Z',
    lin(g, 52, 0, 62, 0, '#8a8f98', '#d8dde4', '#7a808a'),
  );
  shape(g, 'M 62 128 C 67 128 67 135 62 135', null, '#8a8f98', 1.6);
  oval(g, 57, 125.5, 5, 1.6, '#f7f1df');
  oval(g, 84, 133, 11, 5.5, lin(g, 74, 128, 94, 138, '#e5b064', '#a8642a'));
  for (const [sx, sy] of [
    [79, 131],
    [84, 130],
    [89, 131],
  ])
    line(
      g,
      [
        [sx - 1, sy - 1],
        [sx + 1, sy + 1],
      ],
      'rgba(255,240,200,0.6)',
      0.7,
    );
  shape(
    g,
    'M 186 166 L 186 108 C 186 76 296 76 296 108 L 296 166 Z',
    lin(g, 186, 0, 296, 0, '#4a3e36', '#7a685a', '#4a3e36'),
  );
  g.save();
  g.strokeStyle = 'rgba(0,0,0,0.35)';
  g.lineWidth = 0.8;
  for (let i = 0; i <= 8; i++) {
    const a = Math.PI + (i / 8) * Math.PI;
    g.beginPath();
    g.moveTo(241 + Math.cos(a) * 38, 112 + Math.sin(a) * 26);
    g.lineTo(241 + Math.cos(a) * 55, 108 + Math.sin(a) * 32);
    g.stroke();
  }
  g.restore();
  const mouth = 'M 203 166 L 203 116 C 203 96 279 96 279 116 L 279 166 Z';
  shape(g, mouth, lin(g, 0, 96, 0, 166, '#0e0907', '#2a140a'));
  const calm = mood === 'idle';
  const work = mood === 'working';
  g.save();
  g.clip(new Path2D(mouth));
  glow(g, 241, 160, 60, '#ff7a2a', calm ? 0.25 : 0.45);
  fire(g, 241, 164, t, mood, 1.25);
  line(
    g,
    [
      [241, 96],
      [241, 118],
    ],
    '#2a2420',
    1,
  );
  shape(
    g,
    'M 219 120 C 217 150 265 150 263 120 Z',
    lin(g, 219, 0, 263, 0, '#15171b', '#5a606a', '#2a2d33', '#101114'),
  );
  oval(g, 241, 120, 23, 4.4, lin(g, 218, 0, 264, 0, '#2a2d33', '#8a909a', '#2a2d33'));
  oval(g, 241, 120.4, 20, 3.2, lin(g, 0, 117, 0, 123, '#d98a3e', '#8a4a1e'));
  if (!calm)
    for (let i = 0; i < 3; i++) {
      const p = (t * 1.3 + i / 3) % 1;
      oval(g, 232 + i * 9, 120, 1.8 * p, 1 * p, rgba('#ffd08a', 1 - p));
    }
  g.restore();
  if (!calm) steam(g, 241, 112, t, 3, 7, 0.4);
  const stir = work ? t * 3 : 0;
  const tip: Point = [236 + Math.cos(stir) * 7, 120 + Math.sin(stir) * 1.2];
  const x0 = 176;
  const head = dwarf(g, x0, FLOOR, t, mood, {
    tunic: ['#4f6a34', '#2c4020'],
    beard: ['#d9813e', '#8a4220'],
    hairColor: '#c06a2e',
    helm: 'cap',
    apron: ['#efe4cc', '#c9b892'],
    arms: {
      back: { to: [-14, -28], bend: -1 },
      front: calm ? [0.4, -0.5] : { to: [20, -44], bend: 1 },
    },
    prop: (gg, h) => {
      if (calm) {
        line(gg, [h.front, [h.front[0] + 2, h.front[1] + 18]], '#8a6040', 1.8);
        oval(gg, h.front[0] + 2.4, h.front[1] + 20, 3, 1.8, '#8a6040');
        return;
      }
      const lt: Point = [tip[0] - x0, tip[1] - FLOOR];
      line(gg, [[h.front[0] - 4, h.front[1] - 3], lt], '#8a6040', 1.8);
      oval(gg, lt[0], lt[1] + 1, 3.4, 1.8, '#8a6040');
    },
    after: (gg, h) => {
      shape(
        gg,
        `M ${h.back[0] - 4} ${h.back[1] - 1} L ${h.back[0] + 4} ${h.back[1] - 1} L ${h.back[0] + 3} ${h.back[1] + 8} L ${h.back[0] - 3} ${h.back[1] + 8} Z`,
        lin(gg, 0, h.back[1], 0, h.back[1] + 8, '#9aa0a8', '#5a6068'),
      );
      oval(gg, h.back[0], h.back[1] - 1, 4, 1.3, '#f7f1df');
    },
  });
  end(
    g,
    t,
    mood,
    head,
    [
      [120, 30, 40, '#ffb85a'],
      [241, 158, 46, '#ff7a2a'],
    ],
    (gg) => {
      smoke(gg, 241, 100, t);
      smoke(gg, 226, 108, t + 1.3);
    },
  );
};

const travel: SmoothScene = (g, t, mood) => {
  const work = mood === 'working';
  const calm = mood === 'idle';
  const speed = work ? 70 : 0;
  g.fillStyle = lin(g, 0, 0, 0, 170, '#15100d', '#2e241e', '#3a2e26');
  g.fillRect(0, 0, W, 200);
  for (let i = 0; i < 28; i++) {
    const x = ((((hash(i + 90) * 340 - t * speed * 0.35) % 340) + 340) % 340) - 20;
    const y = 10 + hash(i + 91) * 130;
    oval(
      g,
      x,
      y,
      10 + hash(i + 92) * 14,
      6 + hash(i + 93) * 8,
      `rgba(${80 + hash(i) * 30},${64 + hash(i) * 20},${52 + hash(i) * 14},0.45)`,
    );
  }
  const spacing = 120;
  const off = (((t * speed) % spacing) + spacing) % spacing;
  for (let k = -1; k < 4; k++) {
    const x = k * spacing - off + 60;
    shape(
      g,
      `M ${x - 4} 168 L ${x - 4} 34 L ${x + 4} 34 L ${x + 4} 168 Z`,
      lin(g, x - 4, 0, x + 4, 0, '#3a2818', '#7a5634', '#3a2818'),
    );
    shape(
      g,
      `M ${x + 76} 168 L ${x + 76} 34 L ${x + 84} 34 L ${x + 84} 168 Z`,
      lin(g, x + 76, 0, x + 84, 0, '#3a2818', '#7a5634', '#3a2818'),
    );
    box(g, x - 8, 28, 96, 8, 1.5, lin(g, 0, 28, 0, 36, '#8a6038', '#4a3018'));
    lantern(g, x + 40, 50, t + k, mood, false);
    line(
      g,
      [
        [x + 40, 36],
        [x + 40, 41],
      ],
      '#3a3028',
      0.8,
    );
  }
  vignette(g);
  shape(g, 'M 0 166 L 300 166 L 300 200 L 0 200 Z', lin(g, 0, 166, 0, 200, '#3a2e26', '#15100d'));
  const tieGap = 16;
  const tieOff = (((t * speed) % tieGap) + tieGap) % tieGap;
  for (let x = -tieGap; x < W + tieGap; x += tieGap) box(g, x - tieOff, 180, 10, 4, 1, '#4a3420');
  line(
    g,
    [
      [0, 179],
      [W, 179],
    ],
    '#9aa0a8',
    1.6,
  );
  line(
    g,
    [
      [0, 186],
      [W, 186],
    ],
    '#6a7078',
    1.6,
  );
  if (work)
    for (let i = 0; i < 6; i++) {
      const p = (t * 1.6 + i / 6) % 1;
      const y = 60 + hash(i + 7) * 90;
      line(
        g,
        [
          [300 - p * 340, y],
          [300 - p * 340 + 26, y],
        ],
        `rgba(255,230,190,${0.25 * (1 - p)})`,
        0.8,
      );
    }
  const rock = work ? Math.sin(t * 9) * 0.015 : 0;
  const bob = work ? Math.abs(Math.sin(t * 9)) * -1.2 : 0;
  g.save();
  g.translate(150, 176 + bob);
  g.rotate(rock);
  g.translate(-150, -176);
  const x0 = 150;
  const head = dwarf(g, x0, 166, t, mood, {
    tunic: ['#8a4a2a', '#4e2414'],
    beard: ['#7a5a3a', '#3a2614'],
    hairColor: '#6a4a2a',
    helm: 'iron',
    arms: calm
      ? { back: [0.2, -0.3], front: { to: [22, -30], bend: 1 } }
      : {
          back: { to: [-14, -66 + Math.sin(t * 3) * 3], bend: -1 },
          front: { to: [24, -32], bend: 1 },
        },
    prop: (gg, h) => {
      if (calm) return;
      lantern(gg, h.back[0], h.back[1] + 12, t, mood, false);
    },
  });
  const cart = 'M 108 146 L 192 146 L 186 176 L 114 176 Z';
  shape(g, cart, lin(g, 108, 0, 192, 0, '#3a3e44', '#7a828c', '#5a6068', '#2a2d32'));
  box(g, 104, 143, 92, 5, 2, lin(g, 0, 143, 0, 148, '#a8b0ba', '#5a626c'));
  for (const rx of [114, 132, 150, 168, 186]) {
    oval(g, rx, 152, 1, 1, '#c8d0d8');
    oval(g, rx - 1, 170, 1, 1, '#c8d0d8');
  }
  line(
    g,
    [
      [112, 160],
      [188, 160],
    ],
    'rgba(0,0,0,0.25)',
    0.8,
  );
  for (const [gx, gy] of [
    [118, 142],
    [124, 141],
    [121, 139],
  ])
    oval(g, gx, gy, 3, 2.4, rad(g, gx - 1, gy - 1, 3.4, '#fff3b0', GOLD, '#9a6a1e'));
  line(
    g,
    [
      [184, 150],
      [190, 118],
    ],
    '#5a4028',
    2.4,
  );
  oval(g, 190, 117, 2.4, 2.4, '#a8b0ba');
  const spin = work ? t * 12 : 0;
  for (const wx of [128, 172]) {
    oval(g, wx, 178, 7.5, 7.5, lin(g, wx - 7, 172, wx + 7, 186, '#5a626c', '#22252a'));
    g.save();
    g.translate(wx, 178);
    g.rotate(spin);
    for (let i = 0; i < 4; i++) {
      g.rotate(Math.PI / 4);
      line(
        g,
        [
          [-5.5, 0],
          [5.5, 0],
        ],
        '#9aa2ac',
        1,
      );
    }
    g.restore();
    oval(g, wx, 178, 2, 2, '#c8d0d8');
  }
  g.restore();
  end(g, t, mood, head, [], (gg) => {
    smoke(gg, 120, 172, t);
    for (let i = 0; i < 6; i++) {
      const p = (t * 2 + i / 6) % 1;
      oval(gg, 128 - p * 30, 184 - Math.sin(p * Math.PI) * 14, 1, 1, rgba('#ffb84a', 1 - p));
    }
  });
};

const observation: SmoothScene = (g, t, mood) => {
  hall(g, t, [14]);
  const wx = 168;
  const wy = 26;
  const ww = 118;
  const wh = 114;
  const win = `M ${wx} ${wy + wh} L ${wx} ${wy + 40} C ${wx} ${wy - 8} ${wx + ww} ${wy - 8} ${wx + ww} ${wy + 40} L ${wx + ww} ${wy + wh} Z`;
  shape(
    g,
    `M ${wx - 8} ${wy + wh + 4} L ${wx - 8} ${wy + 40} C ${wx - 8} ${wy - 18} ${wx + ww + 8} ${wy - 18} ${wx + ww + 8} ${wy + 40} L ${wx + ww + 8} ${wy + wh + 4} Z`,
    lin(g, wx, 0, wx + ww, 0, '#4a3e36', '#7a685a', '#4a3e36'),
  );
  g.save();
  g.clip(new Path2D(win));
  g.fillStyle = lin(g, 0, wy, 0, wy + wh, '#5a8ac8', '#9cc4e8', '#f2d8b0');
  g.fillRect(wx, wy - 10, ww, wh + 10);
  for (let i = 0; i < 3; i++) {
    const cx = wx + ((hash(i + 3) * ww + t * 4 * (1 + i * 0.4)) % (ww + 40)) - 20;
    oval(g, cx, wy + 22 + i * 12, 14, 4, 'rgba(255,255,255,0.7)');
    oval(g, cx + 8, wy + 19 + i * 12, 9, 4, 'rgba(255,255,255,0.7)');
  }
  shape(
    g,
    `M ${wx} ${wy + 92} L ${wx + 22} ${wy + 58} L ${wx + 40} ${wy + 78} L ${wx + 66} ${wy + 44} L ${wx + 92} ${wy + 74} L ${wx + 106} ${wy + 60} L ${wx + ww} ${wy + 72} L ${wx + ww} ${wy + wh} L ${wx} ${wy + wh} Z`,
    lin(g, 0, wy + 44, 0, wy + wh, '#8a9ab8', '#5a6a88'),
  );
  shape(
    g,
    `M ${wx + 60} ${wy + 52} L ${wx + 66} ${wy + 44} L ${wx + 72} ${wy + 51} L ${wx + 68} ${wy + 50} Z`,
    'rgba(255,255,255,0.85)',
  );
  shape(
    g,
    `M ${wx} ${wy + 100} L ${wx + 30} ${wy + 82} L ${wx + 60} ${wy + 96} L ${wx + 90} ${wy + 84} L ${wx + ww} ${wy + 94} L ${wx + ww} ${wy + wh} L ${wx} ${wy + wh} Z`,
    '#3a4a5e',
  );
  const bird = (t * 12) % (ww + 30);
  const by = wy + 36 + Math.sin(t) * 4;
  const flap = Math.sin(t * 8) * 2;
  line(
    g,
    [
      [wx + bird - 4, by - flap],
      [wx + bird, by],
      [wx + bird + 4, by - flap],
    ],
    '#2a2a36',
    0.9,
  );
  g.restore();
  box(
    g,
    wx - 10,
    wy + wh,
    ww + 20,
    6,
    1.5,
    lin(g, 0, wy + wh, 0, wy + wh + 6, '#8a7868', '#4a3e36'),
  );
  const work = mood === 'working';
  const calm = mood === 'idle';
  const sweep = work ? Math.sin(t * 0.7) * 0.12 : calm ? 0.25 : 0;
  const eye: Point = [142, 124];
  const ang = -0.45 + sweep;
  const tube = (len: number): Point => [eye[0] + Math.cos(ang) * len, eye[1] + Math.sin(ang) * len];
  const pivot = tube(26);
  line(g, [pivot, [pivot[0] - 14, FLOOR]], '#5a4028', 2);
  line(g, [pivot, [pivot[0] + 12, FLOOR]], '#5a4028', 2);
  line(g, [pivot, [pivot[0] + 1, FLOOR - 2]], '#4a3420', 2);
  const x0 = 124;
  const head = dwarf(g, x0, FLOOR, t, mood, {
    tunic: ['#2f6a6a', '#173a3e'],
    beard: ['#8a5a32', '#4a2a14'],
    hairColor: '#6a4024',
    helm: 'cap',
    cap: ['#3a5a8a', '#1e3058', '#c9a24a'],
    arms: calm
      ? { back: [0.2, -0.3], front: [0.4, -0.4] }
      : {
          front: { to: [tube(34)[0] - x0, tube(34)[1] - FLOOR + 3], bend: 1 },
          back: { to: [tube(16)[0] - x0, tube(16)[1] - FLOOR + 3], bend: 1 },
        },
  });
  const a = tube(4);
  const b = tube(62);
  g.save();
  g.lineCap = 'round';
  g.strokeStyle = lin(g, a[0], a[1] - 4, a[0] + 4, a[1] + 4, '#f0d080', '#a8782a');
  g.lineWidth = 5;
  g.beginPath();
  g.moveTo(a[0], a[1]);
  g.lineTo(tube(30)[0], tube(30)[1]);
  g.stroke();
  g.lineWidth = 7;
  g.beginPath();
  g.moveTo(tube(30)[0], tube(30)[1]);
  g.lineTo(b[0], b[1]);
  g.stroke();
  g.restore();
  for (const l of [14, 30, 46]) {
    const p = tube(l);
    oval(g, p[0], p[1], 1.6, 4.2, '#7a5418', ang);
  }
  oval(g, b[0], b[1], 2, 4.4, '#cfe8ff', ang);
  if (work && (t * 0.5) % 1 < 0.15) glow(g, b[0], b[1], 10, '#ffffff', 0.9);
  end(g, t, mood, [head[0] - 4, head[1]], [], (gg) => smoke(gg, 220, 120, t));
};

const analysis: SmoothScene = (g, t, mood) => {
  hall(g, t);
  lantern(g, 222, 30, t, mood);
  const work = mood === 'working';
  const calm = mood === 'idle';
  const hot = mood === 'trouble';
  box(g, 156, 138, 128, 6, 1.5, lin(g, 0, 138, 0, 144, '#8a6040', '#4a3020'));
  line(
    g,
    [
      [164, 144],
      [164, 166],
    ],
    '#4a301c',
    3.4,
  );
  line(
    g,
    [
      [276, 144],
      [276, 166],
    ],
    '#4a301c',
    3.4,
  );
  box(g, 248, 124, 28, 14, 1.5, lin(g, 0, 124, 0, 138, '#6a2a24', '#3a1410'));
  box(g, 250, 123, 24, 2.4, 1, '#efe4cc');
  for (let i = 0; i < 4; i++)
    line(
      g,
      [
        [250, 128 + i * 2.6],
        [274, 128 + i * 2.6],
      ],
      'rgba(255,230,190,0.15)',
      0.5,
    );
  const cx = 212;
  const tilt = work ? Math.sin(t * 1.3) * 0.16 : hot ? 0.32 : calm ? 0 : 0.05;
  box(g, cx - 10, 134, 20, 4, 1.5, lin(g, cx - 10, 0, cx + 10, 0, '#8a6420', '#f0cc70', '#8a6420'));
  line(
    g,
    [
      [cx, 134],
      [cx, 92],
    ],
    lin(g, cx - 2, 0, cx + 2, 0, '#8a6420', '#f0cc70'),
    2.4,
  );
  oval(g, cx, 90, 3, 3, '#f0cc70');
  const arm = (s: number): Point => [cx + Math.cos(tilt) * 30 * s, 92 + Math.sin(tilt) * 30 * s];
  const L = arm(-1);
  const R = arm(1);
  line(g, [L, R], lin(g, L[0], 0, R[0], 0, '#a8782a', '#f0cc70', '#a8782a'), 2);
  const pan = (p: Point, gems: readonly string[]): void => {
    const py = p[1] + 26;
    line(g, [p, [p[0] - 9, py]], 'rgba(220,200,150,0.7)', 0.5);
    line(g, [p, [p[0] + 9, py]], 'rgba(220,200,150,0.7)', 0.5);
    gems.forEach((hex, i) => {
      const gx = p[0] - 4 + i * 4;
      const gy = py - 2.5;
      shape(
        g,
        `M ${gx} ${gy - 3} L ${gx + 2.2} ${gy} L ${gx} ${gy + 2} L ${gx - 2.2} ${gy} Z`,
        lin(g, gx - 2, gy - 3, gx + 2, gy + 2, '#ffffff', hex, hex),
      );
      if (!calm) glow(g, gx, gy - 1, 4, hex, 0.3 + 0.4 * Math.abs(Math.sin(t * 3 + i)));
    });
    shape(
      g,
      `M ${p[0] - 11} ${py} C ${p[0] - 9} ${py + 6} ${p[0] + 9} ${py + 6} ${p[0] + 11} ${py} Z`,
      lin(g, p[0] - 11, 0, p[0] + 11, 0, '#8a6420', '#f0cc70', '#8a6420'),
    );
  };
  pan(L, ['#4ad0ff', '#ff4a7a', '#7affa0']);
  pan(
    R,
    work && Math.sin(t * 1.3) > 0 ? ['#c86aff', '#ffd24a'] : ['#c86aff', '#ffd24a', '#4ad0ff'],
  );
  box(g, 166, 126, 22, 12, 1.5, lin(g, 0, 126, 0, 138, '#7a5434', '#4a301c'));
  for (let r = 0; r < 3; r++) {
    line(
      g,
      [
        [167, 129 + r * 3.4],
        [187, 129 + r * 3.4],
      ],
      '#c9a24a',
      0.5,
    );
    for (let i = 0; i < 5; i++) {
      const slide = work ? (Math.sin(t * 2 + r * 2 + i) > 0.6 ? 6 : 0) : 0;
      oval(g, 169 + i * 2.6 + slide, 129 + r * 3.4, 1.2, 1.2, ['#c8243a', '#2a6ac8', '#e2b54e'][r]);
    }
  }
  const x0 = 136;
  const head = dwarf(g, x0, FLOOR, t, mood, {
    tunic: ['#6a3a7a', '#3a1c48'],
    beard: ['#c8c4bc', '#7a7670'],
    hairColor: '#b8b4ac',
    glasses: true,
    helm: 'cap',
    cap: ['#2a2a36', '#14141a', GOLD],
    arms: calm
      ? { back: [0.2, -0.3], front: [0.3, -0.5] }
      : {
          back: { to: [-2, -40], bend: -1 },
          front: {
            to: [R[0] - x0 - 26, R[1] - FLOOR + 14 + (work ? Math.sin(t * 1.3) * 4 : 0)],
            bend: 1,
          },
        },
    after: (gg, h) => {
      if (calm) return;
      const gx = h.front[0] + 3;
      const gy = h.front[1] - 3;
      shape(
        gg,
        `M ${gx} ${gy - 3} L ${gx + 2.2} ${gy} L ${gx} ${gy + 2} L ${gx - 2.2} ${gy} Z`,
        lin(gg, gx - 2, gy - 3, gx + 2, gy + 2, '#ffffff', '#4ad0ff', '#2a8ac8'),
      );
      glow(gg, gx, gy, 5, '#4ad0ff', 0.6);
    },
  });
  end(g, t, mood, head, [[222, 30, 40, '#ffb85a']], (gg) => smoke(gg, 212, 80, t));
};

const RUNES = 15;

const coding: SmoothScene = (g, t, mood) => {
  hall(g, t);
  lantern(g, 120, 34, t, mood);
  const work = mood === 'working';
  const calm = mood === 'idle';
  const hot = mood === 'trouble';
  const stone =
    'M 206 168 C 202 120 204 70 220 48 C 232 34 256 36 266 52 C 278 74 280 120 276 168 Z';
  shape(g, stone, lin(g, 204, 0, 278, 0, '#5a5650', '#9a968c', '#6a665e', '#3a3832'));
  g.save();
  g.clip(new Path2D(stone));
  oval(g, 214, 60, 10, 18, 'rgba(255,255,255,0.08)', 0.3);
  oval(g, 268, 150, 14, 10, 'rgba(110,150,70,0.35)');
  g.restore();
  oval(g, 241, 170, 40, 4, 'rgba(0,0,0,0.4)');
  const done = work ? Math.floor((t * 1.2) % (RUNES + 4)) : calm ? 9 : 12;
  for (let i = 0; i < RUNES; i++) {
    const r = Math.floor(i / 5);
    const c = i % 5;
    const x = 222 + c * 9;
    const y = 74 + r * 22;
    const lit = i < done;
    const kind = (i * 7) % 4;
    g.save();
    g.translate(x, y);
    g.lineCap = 'round';
    g.lineWidth = 1.3;
    g.strokeStyle = lit ? (hot ? '#ff6a5a' : '#8cf0ff') : 'rgba(40,36,30,0.6)';
    if (lit) {
      g.shadowColor = hot ? '#ff4d4d' : '#8cf0ff';
      g.shadowBlur = 6;
    }
    g.beginPath();
    if (kind === 0) {
      g.moveTo(0, -5);
      g.lineTo(0, 5);
      g.moveTo(0, -5);
      g.lineTo(3, -2);
    } else if (kind === 1) {
      g.moveTo(-3, 5);
      g.lineTo(0, -5);
      g.lineTo(3, 5);
    } else if (kind === 2) {
      g.moveTo(0, -5);
      g.lineTo(0, 5);
      g.moveTo(-3, -1);
      g.lineTo(3, 2);
    } else {
      g.moveTo(-2.5, -5);
      g.lineTo(2.5, 0);
      g.lineTo(-2.5, 5);
    }
    g.stroke();
    g.restore();
  }
  const cycle = (t * 2.4) % 1;
  const strike = work && cycle > 0.82;
  const raise = work ? (cycle < 0.7 ? cycle / 0.7 : Math.max(0, 1 - (cycle - 0.7) / 0.12)) : 0;
  const chisel: Point = [212, 128];
  if (strike) {
    for (let i = 0; i < 7; i++) {
      const a = -Math.PI * 0.9 + hash(i + Math.floor(t * 2.4)) * Math.PI * 0.8;
      const d = 4 + (cycle - 0.82) * 80 * (0.5 + hash(i));
      oval(g, chisel[0] + Math.cos(a) * d, chisel[1] + Math.sin(a) * d, 0.9, 0.9, '#ffe08a');
    }
    glow(g, chisel[0], chisel[1], 10, '#ffd27a', 1);
  }
  const x0 = 186;
  const head = dwarf(g, x0, FLOOR, t, mood, {
    tunic: ['#5a4a3a', '#2e241a'],
    beard: ['#3a3a40', '#16161a'],
    hairColor: '#2a2a30',
    apron: ['#7a4a2a', '#4a2a14'],
    helm: 'iron',
    arms: calm
      ? { back: [0.2, -0.3], front: [0.4, -0.4] }
      : {
          back: { to: [chisel[0] - x0 - 8, chisel[1] - FLOOR + 2], bend: 1 },
          front: { to: [14 - raise * 4, -50 - raise * 16], bend: 1 },
        },
    prop: (gg, h) => {
      if (calm) return;
      line(
        gg,
        [
          [h.back[0] - 2, h.back[1] + 1],
          [chisel[0] - x0, chisel[1] - FLOOR],
        ],
        '#b8c0c8',
        1.6,
      );
    },
    after: (gg, h) => {
      const [hx, hy] = h.front;
      const ang = calm ? Math.PI / 2 : -0.4 - raise * 1.1;
      const head2: Point = [hx + Math.cos(ang) * 12, hy + Math.sin(ang) * 12];
      line(gg, [h.front, head2], '#7a5434', 2);
      gg.save();
      gg.translate(head2[0], head2[1]);
      gg.rotate(ang);
      box(gg, -2, -4.5, 6, 9, 1.4, lin(gg, 0, -4.5, 0, 4.5, '#d8dee4', '#6a727c'));
      gg.restore();
    },
  });
  end(g, t, mood, head, [[120, 34, 40, '#ffb85a']], (gg) => smoke(gg, 240, 60, t));
};

const security: SmoothScene = (g, t, mood) => {
  hall(g, t);
  lantern(g, 70, 34, t, mood);
  const cx = 232;
  const cy = 104;
  const R = 58;
  const work = mood === 'working';
  const calm = mood === 'idle';
  const hot = mood === 'trouble';
  g.beginPath();
  g.arc(cx, cy, R + 8, 0, TAU);
  g.fillStyle = lin(g, cx - R, cy - R, cx + R, cy + R, '#5a4a40', '#2a211c');
  g.fill();
  g.beginPath();
  g.arc(cx, cy, R, 0, TAU);
  const door = g.createRadialGradient(cx - 18, cy - 22, 6, cx, cy, R);
  door.addColorStop(0, '#c9a46a');
  door.addColorStop(0.55, '#8a6a3e');
  door.addColorStop(1, '#4a3820');
  g.fillStyle = door;
  g.fill();
  g.strokeStyle = '#2e2214';
  g.lineWidth = 2;
  g.stroke();
  for (const r of [R - 9, R - 24, 16]) {
    g.beginPath();
    g.arc(cx, cy, r, 0, TAU);
    g.strokeStyle = 'rgba(40,28,14,0.6)';
    g.lineWidth = 1.2;
    g.stroke();
    g.beginPath();
    g.arc(cx, cy, r - 1.2, Math.PI * 1.1, Math.PI * 1.6);
    g.strokeStyle = 'rgba(255,230,180,0.35)';
    g.lineWidth = 0.8;
    g.stroke();
  }
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * TAU;
    oval(g, cx + Math.cos(a) * (R - 4), cy + Math.sin(a) * (R - 4), 1.4, 1.4, '#e8cf94');
  }
  const spin = work ? t * 0.35 : 0.2;
  for (let i = 0; i < 12; i++) {
    const a = spin + (i / 12) * TAU;
    const rr = R - 16.5;
    const lit = work ? Math.max(0, Math.sin(t * 2.4 - i * 0.9)) : calm ? 0.1 : 0.35;
    g.save();
    g.translate(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
    g.rotate(a + Math.PI / 2);
    g.strokeStyle = hot
      ? `rgba(255,90,80,${0.4 + 0.6 * Math.abs(Math.sin(t * 6 + i))})`
      : `rgba(140,240,255,${0.25 + lit * 0.75})`;
    g.shadowColor = hot ? '#ff4d4d' : '#8cf0ff';
    g.shadowBlur = 6 * lit + (hot ? 4 : 0);
    g.lineWidth = 1;
    g.lineCap = 'round';
    g.beginPath();
    const kind = i % 4;
    if (kind === 0) {
      g.moveTo(0, -3);
      g.lineTo(0, 3);
      g.moveTo(0, -3);
      g.lineTo(2.4, -0.6);
    } else if (kind === 1) {
      g.moveTo(-2, 3);
      g.lineTo(0, -3);
      g.lineTo(2, 3);
    } else if (kind === 2) {
      g.moveTo(0, -3);
      g.lineTo(0, 3);
      g.moveTo(-2.2, -1);
      g.lineTo(2.2, 1);
    } else {
      g.moveTo(-2, -3);
      g.lineTo(2, 0);
      g.lineTo(-2, 3);
    }
    g.stroke();
    g.restore();
  }
  g.save();
  g.translate(cx, cy);
  g.rotate(work ? -t * 0.5 : 0);
  for (let i = 0; i < 6; i++) {
    g.rotate(TAU / 6);
    line(
      g,
      [
        [4, 0],
        [14, 0],
      ],
      '#d8b46a',
      2.4,
    );
    oval(g, 14.5, 0, 2.2, 2.2, '#e8c47a');
  }
  g.restore();
  oval(g, cx, cy, 6, 6, rad(g, cx - 2, cy - 2, 7, '#fff2c0', GOLD, '#8a6420'));
  if (work || mood === 'waiting')
    glow(g, cx, cy, 22, '#8cf0ff', mood === 'waiting' ? 0.3 + 0.2 * Math.sin(t * 4) : 0.25);
  if (hot) {
    g.save();
    g.shadowColor = '#ff6a3d';
    g.shadowBlur = 6;
    line(
      g,
      [
        [cx - 30, cy - 40],
        [cx - 18, cy - 20],
        [cx - 24, cy - 6],
        [cx - 10, cy + 6],
      ],
      '#2a1408',
      1.4,
    );
    g.restore();
  }
  const glint = work ? (t * 0.5) % 1 : -1;
  const head = dwarf(g, 150, FLOOR, t, mood, {
    flip: true,
    tunic: ['#8a94a2', '#4a525e'],
    mail: true,
    beard: ['#3a302a', '#15110e'],
    hairColor: '#2a221d',
    helm: 'iron',
    legs: '#3a2e26',
    arms: { back: [-0.1, -0.3], front: calm ? [0.35, -0.6] : [0.9, -1.2] },
    prop: (gg, h) => {
      const [hx, hy] = h.back;
      line(
        gg,
        [
          [hx + 1, hy + 18],
          [hx - 1, hy - 42],
        ],
        lin(gg, 0, hy - 42, 0, hy + 18, '#8a6040', '#5a3a24'),
        2.6,
      );
      const ty = hy - 40;
      const blade = shape(
        gg,
        `M ${hx} ${ty - 2} C ${hx - 6} ${ty - 10} ${hx - 16} ${ty - 10} ${hx - 19} ${ty - 2} C ${hx - 19} ${ty + 6} ${hx - 16} ${ty + 14} ${hx - 6} ${ty + 12} C ${hx - 4} ${ty + 8} ${hx - 1} ${ty + 7} ${hx} ${ty + 7} Z`,
        lin(gg, hx - 19, ty - 8, hx, ty + 12, '#eef2f6', '#9aa4b0', '#5a626e'),
      );
      if (glint >= 0 && glint < 0.3) {
        gg.save();
        gg.clip(blade);
        gg.globalCompositeOperation = 'lighter';
        const gp = glint / 0.3;
        line(
          gg,
          [
            [hx - 22 + gp * 24, ty - 12],
            [hx - 30 + gp * 24, ty + 14],
          ],
          'rgba(255,255,255,0.8)',
          3,
        );
        gg.restore();
      }
      shape(gg, `M ${hx + 1} ${ty - 1} L ${hx + 6} ${ty + 2} L ${hx + 1} ${ty + 5} Z`, '#7a838e');
    },
    after: (gg, h) => {
      const sx = h.front[0] + 1;
      const sy = h.front[1] + 2;
      gg.beginPath();
      gg.arc(sx, sy, 15, 0, TAU);
      const sh = gg.createRadialGradient(sx - 5, sy - 6, 2, sx, sy, 15);
      sh.addColorStop(0, '#b07a46');
      sh.addColorStop(1, '#5a3418');
      gg.fillStyle = sh;
      gg.fill();
      gg.save();
      gg.clip();
      gg.strokeStyle = 'rgba(40,20,8,0.45)';
      gg.lineWidth = 0.7;
      for (let k = -12; k <= 12; k += 6) {
        gg.beginPath();
        gg.moveTo(sx + k, sy - 16);
        gg.lineTo(sx + k, sy + 16);
        gg.stroke();
      }
      gg.restore();
      gg.beginPath();
      gg.arc(sx, sy, 15, 0, TAU);
      gg.strokeStyle = '#aab2bc';
      gg.lineWidth = 2.6;
      gg.stroke();
      oval(gg, sx, sy, 4.4, 4.4, rad(gg, sx - 1.5, sy - 1.5, 5, '#fff2c0', GOLD, '#8a6420'));
      gg.save();
      gg.strokeStyle = 'rgba(226,181,78,0.8)';
      gg.lineWidth = 1;
      for (let k = 0; k < 4; k++) {
        const a = k * (TAU / 4) + 0.4;
        gg.beginPath();
        gg.moveTo(sx + Math.cos(a) * 6.5, sy + Math.sin(a) * 6.5);
        gg.lineTo(sx + Math.cos(a) * 11, sy + Math.sin(a) * 11);
        gg.stroke();
      }
      gg.restore();
    },
  });
  end(g, t, mood, [head[0] - 26, head[1]], [[70, 34, 40, '#ffb85a']], (gg) =>
    smoke(gg, cx - 20, 70, t),
  );
};

export const DEEPFORGE: Readonly<Record<string, SmoothScene>> = {
  assistant,
  kitchen,
  travel,
  observation,
  analysis,
  coding,
  security,
};
