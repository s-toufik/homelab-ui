import type { AgentMood } from '../../../domain/agent-activity';
import {
  H,
  TAU,
  W,
  blob,
  box,
  clamp,
  finish,
  glow,
  hash,
  leaf,
  lerp,
  lin,
  line,
  orb,
  oval,
  rad,
  rgba,
  shape,
  type BubbleStyle,
  type Ctx,
  type Point,
  type SmoothScene,
} from './kit';

const BUBBLE: BubbleStyle = {
  paper: 'rgba(20,26,58,0.92)',
  ink: '#bfe3ff',
  edge: 'rgba(170,200,255,0.6)',
};
const NIGHT = '#1b1f45';
const COUNTER = 140;

function studio(g: Ctx, t: number, mood: AgentMood, hues: readonly string[]): void {
  g.fillStyle = lin(g, 0, 0, 0, H, '#0a0d1f', '#141a3c', '#0c1026');
  g.fillRect(0, 0, W, H);
  g.save();
  g.globalCompositeOperation = 'lighter';
  hues.forEach((hex, i) => {
    const x = 50 + i * 100 + Math.sin(t * 0.22 + i * 2.1) * 28;
    const y = 50 + Math.cos(t * 0.18 + i) * 16;
    blob(g, x, y, 110, 62, hex, mood === 'idle' ? 0.12 : 0.3);
  });
  g.restore();
  const hz = 150;
  g.fillStyle = lin(g, 0, hz, 0, H, '#151a3c', '#070918');
  g.fillRect(0, hz, W, H - hz);
  g.save();
  g.strokeStyle = 'rgba(160,180,255,0.12)';
  g.lineWidth = 0.6;
  for (let i = -9; i <= 9; i++) {
    g.beginPath();
    g.moveTo(150 + i * 13, hz);
    g.lineTo(150 + i * 58, H);
    g.stroke();
  }
  const scroll = mood === 'working' ? (t * 0.3) % 1 : 0.4;
  for (let k = 0; k < 7; k++) {
    const p = (k + scroll) / 7;
    const y = hz + Math.pow(p, 2.1) * (H - hz);
    g.globalAlpha = 0.25 + p * 0.75;
    g.beginPath();
    g.moveTo(0, y);
    g.lineTo(W, y);
    g.stroke();
  }
  g.restore();
  g.fillStyle = lin(
    g,
    0,
    hz - 2,
    0,
    hz + 3,
    'rgba(150,170,255,0)',
    'rgba(170,190,255,0.45)',
    'rgba(150,170,255,0)',
  );
  g.fillRect(0, hz - 2, W, 5);
  for (let i = 0; i < 22; i++) {
    const x = hash(i) * W;
    const sp = 3 + hash(i + 3) * 5;
    const y = (((hash(i + 9) * 150 - t * sp) % 150) + 150) % 150;
    g.fillStyle = `rgba(200,215,255,${0.25 + 0.45 * Math.abs(Math.sin(t * 1.3 + i))})`;
    g.beginPath();
    g.arc(x, y, 0.5 + hash(i + 5) * 0.9, 0, TAU);
    g.fill();
  }
}

function glass(g: Ctx, x: number, y: number, w: number, h: number, r = 8): void {
  g.save();
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = 'rgba(255,255,255,0.07)';
  g.fill();
  g.strokeStyle = lin(
    g,
    x,
    y,
    x + w,
    y + h,
    'rgba(255,255,255,0.45)',
    'rgba(255,255,255,0.06)',
    'rgba(255,255,255,0.2)',
  );
  g.lineWidth = 0.8;
  g.stroke();
  g.restore();
}

function counter(g: Ctx, x0: number, x1: number): void {
  const top = COUNTER;
  shape(
    g,
    `M ${x0 + 8} ${top} L ${x1 - 8} ${top} L ${x1} ${top + 9} L ${x0} ${top + 9} Z`,
    lin(g, 0, top, 0, top + 9, 'rgba(255,255,255,0.2)', 'rgba(255,255,255,0.06)'),
  );
  line(
    g,
    [
      [x0 + 8, top],
      [x1 - 8, top],
    ],
    lin(
      g,
      x0,
      0,
      x1,
      0,
      'rgba(255,255,255,0.05)',
      'rgba(255,255,255,0.7)',
      'rgba(255,255,255,0.05)',
    ),
    0.8,
  );
  g.fillStyle = 'rgba(255,255,255,0.05)';
  g.fillRect(x0, top + 9, x1 - x0, 9);
}

function label(g: Ctx, text: string, x: number, y: number, size = 7, alpha = 0.85): void {
  g.save();
  g.fillStyle = `rgba(230,236,255,${alpha})`;
  g.font = `600 ${size}px system-ui, sans-serif`;
  g.fillText(text, x, y);
  g.restore();
}

function eyes(g: Ctx, x: number, y: number, t: number, mood: AgentMood, col: string): void {
  g.save();
  g.shadowColor = col;
  g.shadowBlur = 7;
  g.fillStyle = col;
  g.strokeStyle = col;
  g.lineCap = 'round';
  const blink = t % 3.7 < 0.12;
  for (const s of [-1, 1]) {
    const ex = x + s * 5.4;
    if (mood === 'idle') {
      g.lineWidth = 1.5;
      g.beginPath();
      g.arc(ex, y - 1.5, 2.6, 0.15 * Math.PI, 0.85 * Math.PI);
      g.stroke();
    } else if (mood === 'trouble') {
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(ex - 2.3, y - 2.3);
      g.lineTo(ex + 2.3, y + 2.3);
      g.moveTo(ex + 2.3, y - 2.3);
      g.lineTo(ex - 2.3, y + 2.3);
      g.stroke();
    } else if (blink) {
      g.lineWidth = 1.5;
      g.beginPath();
      g.moveTo(ex - 2, y);
      g.lineTo(ex + 2, y);
      g.stroke();
    } else if (mood === 'waiting') {
      oval(g, ex, y, 2.9, 3.5, col);
      g.shadowBlur = 0;
      oval(g, ex - 0.9, y - 1.3, 0.9, 0.9, 'rgba(255,255,255,0.9)');
      g.shadowBlur = 7;
    } else {
      g.beginPath();
      g.roundRect(ex - 1.6, y - 3.7, 3.2, 7.4, 1.6);
      g.fill();
    }
  }
  g.restore();
}

interface BeingOptions {
  readonly look?: number;
  readonly hands?: readonly Point[];
  readonly phase?: number;
}

function being(
  g: Ctx,
  x: number,
  y: number,
  t: number,
  mood: AgentMood,
  hex: string,
  o: BeingOptions = {},
): Point {
  const look = o.look ?? 0;
  const calm = mood === 'idle';
  const col = mood === 'trouble' ? '#ff4d6d' : hex;
  const bob = Math.sin(t * (calm ? 1.1 : 2.1) + (o.phase ?? 0)) * (calm ? 1.5 : 3);
  const floor = y + 58;
  oval(g, x, floor, 20 - bob * 0.6, 3.6, 'rgba(0,0,0,0.5)');
  g.save();
  g.globalCompositeOperation = 'lighter';
  blob(g, x, floor + 1, 32, 6, col, calm ? 0.12 : 0.35);
  g.restore();
  y += bob;
  const tilt = -0.12;
  g.save();
  g.strokeStyle = rgba(col, calm ? 0.2 : 0.6);
  g.lineWidth = 1.1;
  g.beginPath();
  g.ellipse(x, y + 13, 28, 7, tilt, Math.PI, TAU);
  g.stroke();
  g.restore();
  const body = shape(
    g,
    `M${x - 13} ${y + 4} C${x - 14.5} ${y + 21} ${x - 6} ${y + 34} ${x} ${y + 35} C${x + 6} ${y + 34} ${x + 14.5} ${y + 21} ${x + 13} ${y + 4} C${x + 11} ${y - 1.5} ${x - 11} ${y - 1.5} ${x - 13} ${y + 4}Z`,
    lin(g, x - 14, y, x + 14, y + 35, '#ffffff', '#e2e7f7', '#98a3c6'),
  );
  g.save();
  g.clip(body);
  g.globalCompositeOperation = 'lighter';
  blob(g, x + 2, y + 16, 14, 14, col, calm ? 0.3 : 0.8 + 0.2 * Math.sin(t * 4));
  g.globalCompositeOperation = 'source-over';
  oval(g, x - 6.5, y + 11, 2.6, 8, 'rgba(255,255,255,0.75)', 0.15);
  g.restore();
  g.save();
  g.strokeStyle = rgba(col, calm ? 0.35 : 0.95);
  g.lineWidth = 1.4;
  g.shadowColor = col;
  g.shadowBlur = calm ? 0 : 6;
  g.beginPath();
  g.ellipse(x, y + 13, 28, 7, tilt, 0, Math.PI);
  g.stroke();
  if (!calm) {
    const a = (t * 2.4) % TAU;
    const ca = Math.cos(tilt);
    const sa = Math.sin(tilt);
    const ex = Math.cos(a) * 28;
    const ey = Math.sin(a) * 7;
    if (Math.sin(a) > 0)
      oval(g, x + ex * ca - ey * sa, y + 13 + ex * sa + ey * ca, 1.8, 1.8, '#ffffff');
  }
  g.restore();
  const hands = o.hands ?? [
    [-23, 15],
    [23, 15],
  ];
  for (const [hx, hy] of hands) {
    oval(g, x + hx, y + hy + 2, 4.6, 1.6, 'rgba(0,0,0,0.18)');
    oval(
      g,
      x + hx,
      y + hy,
      4.8,
      4.8,
      lin(g, x + hx - 4, y + hy - 5, x + hx + 4, y + hy + 5, '#ffffff', '#b4bedc'),
    );
    g.save();
    g.globalCompositeOperation = 'lighter';
    blob(g, x + hx, y + hy, 7, 7, col, calm ? 0.1 : 0.35);
    g.restore();
  }
  const hy = y - 15;
  oval(
    g,
    x,
    hy,
    20.5,
    15.5,
    lin(g, x - 20, hy - 15, x + 14, hy + 15, '#ffffff', '#edf0fa', '#b2bbd8'),
  );
  g.save();
  g.strokeStyle = rgba(col, 0.7);
  g.lineWidth = 1;
  g.shadowColor = col;
  g.shadowBlur = 4;
  g.beginPath();
  g.ellipse(x, hy, 20, 15, 0, -0.5, 1.1);
  g.stroke();
  g.restore();
  const vx = x + look * 3;
  g.beginPath();
  g.ellipse(vx, hy + 1, 14.5, 9.6, 0, 0, TAU);
  g.fillStyle = lin(g, vx, hy - 9, vx, hy + 10, '#232a52', '#05070f');
  g.fill();
  g.save();
  g.clip();
  oval(g, vx - 6, hy - 6, 10, 3, 'rgba(255,255,255,0.13)', -0.25);
  g.restore();
  eyes(g, vx + look * 2, hy + 1.5, t, mood, col);
  oval(g, x - 11, hy - 8, 4, 2, 'rgba(255,255,255,0.95)', -0.55);
  return [x, hy - 10];
}

function glitch(g: Ctx, t: number): void {
  const c = g.canvas;
  if (!c || !c.width) return;
  const k = Math.floor(t * 10);
  const s = c.width / W;
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  for (let i = 0; i < 4; i++) {
    if (hash(k * 5 + i) < 0.4) continue;
    const y = Math.floor(hash(k * 7 + i) * c.height);
    const h = Math.max(1, Math.floor((2 + hash(k * 3 + i) * 7) * s));
    const dx = Math.floor((hash(k * 11 + i) - 0.5) * 14 * s);
    g.drawImage(c, 0, y, c.width, h, dx, y, c.width, h);
    g.fillStyle = i % 2 ? 'rgba(255,46,99,0.16)' : 'rgba(46,230,255,0.16)';
    g.fillRect(0, y, c.width, h);
  }
  g.restore();
}

function end(g: Ctx, t: number, mood: AgentMood, head: Point, z: string): void {
  finish(g, t, mood, { head, bubble: BUBBLE, z, night: NIGHT });
  if (mood === 'trouble') glitch(g, t);
}

const assistant: SmoothScene = (g, t, mood) => {
  studio(g, t, mood, ['#4e6bff', '#a259ff', '#2fc8ff']);
  const work = mood === 'working';
  const calm = mood === 'idle';
  const hot = mood === 'trouble';
  const cx = 150;
  const cy = 84;
  g.save();
  g.translate(cx, cy + 6);
  g.strokeStyle = 'rgba(170,190,255,0.18)';
  g.lineWidth = 0.7;
  g.beginPath();
  g.arc(0, 0, 58, 0, TAU);
  g.stroke();
  g.beginPath();
  g.arc(0, 0, 67, 0, TAU);
  g.stroke();
  g.rotate(t * (work ? 0.25 : 0.03));
  for (let i = 0; i < 72; i++) {
    const a = (i / 72) * TAU;
    const l = i % 6 ? 2.5 : 6;
    g.globalAlpha = i % 6 ? 0.35 : 0.8;
    g.beginPath();
    g.moveTo(Math.cos(a) * 58, Math.sin(a) * 58);
    g.lineTo(Math.cos(a) * (58 + l), Math.sin(a) * (58 + l));
    g.stroke();
  }
  g.restore();
  const speed = work ? 0.6 : calm ? 0 : 0.12;
  const orbs = ['#ff9b4a', '#2ed3b7', '#b48cff'].map((hex, i) => {
    const a = (calm ? 0.5 : t * speed) + (i * TAU) / 3;
    return { hex, i, x: cx + Math.cos(a) * 100, y: cy + 34 + Math.sin(a) * 24, d: Math.sin(a) };
  });
  type Helper = (typeof orbs)[number];
  const core: Point = [cx, cy + 12];
  const link = (o: Helper): void => {
    g.save();
    if (hot) {
      g.setLineDash([3, 4]);
      g.lineDashOffset = -t * 20;
    }
    line(
      g,
      [core, [o.x, o.y]],
      hot ? rgba('#ff4d6d', 0.45 + 0.3 * Math.sin(t * 9 + o.i)) : rgba(o.hex, calm ? 0.12 : 0.4),
      1,
    );
    g.restore();
    if (work)
      for (let k = 0; k < 2; k++) {
        const p = (t * 0.8 + o.i / 3 + k / 2) % 1;
        const px = lerp(core[0], o.x, p);
        const py = lerp(core[1], o.y, p);
        glow(g, px, py, 6, o.hex, 0.9);
        oval(g, px, py, 1.3, 1.3, '#ffffff');
      }
  };
  const helper = (o: Helper): void => {
    const r = 9 + o.d * 2;
    oval(g, o.x, cy + 66, r * 0.9, 2.2, 'rgba(0,0,0,0.35)');
    glow(g, o.x, o.y, r * 2.2, o.hex, calm ? 0.15 : 0.45);
    orb(g, o.x, o.y, r, o.hex);
    g.strokeStyle = 'rgba(255,255,255,0.5)';
    g.lineWidth = 0.6;
    g.stroke();
    if (mood === 'waiting' && o.i === 0) {
      g.save();
      g.strokeStyle = rgba('#ffd166', 0.5 + 0.5 * Math.sin(t * 5));
      g.lineWidth = 1.2;
      g.beginPath();
      g.arc(o.x, o.y, r + 4, 0, TAU);
      g.stroke();
      g.restore();
    }
  };
  const back = orbs.filter((o) => o.d < 0);
  const front = orbs.filter((o) => o.d >= 0);
  back.forEach(link);
  back.forEach(helper);
  const hands: Point[] = work
    ? [
        [-26, 3 + Math.sin(t * 3) * 7],
        [26, 3 - Math.sin(t * 3 + 1) * 7],
      ]
    : [
        [-23, 15],
        [23, 15],
      ];
  const head = being(g, cx, cy, t, mood, '#7aa2ff', { hands });
  front.forEach(link);
  front.forEach(helper);
  end(g, t, mood, head, '#c9d6ff');
};

const kitchen: SmoothScene = (g, t, mood) => {
  studio(g, t, mood, ['#ff7a45', '#ff4fa3', '#4f6bff']);
  const work = mood === 'working';
  const calm = mood === 'idle';
  const hot = mood === 'trouble';
  const acc = '#ff9b4a';
  glass(g, 206, 22, 82, 50, 9);
  label(g, 'RISOTTO', 214, 35);
  label(g, 'step 3 of 5', 214, 44, 6, 0.5);
  g.save();
  g.fillStyle = 'rgba(230,236,255,0.18)';
  [52, 58, 64].forEach((y, i) => {
    g.beginPath();
    g.roundRect(214, y, 40 - i * 9, 2.2, 1.1);
    g.fill();
  });
  const prog = work ? (t * 0.07) % 1 : 0.42;
  g.lineWidth = 2.2;
  g.lineCap = 'round';
  g.strokeStyle = 'rgba(255,255,255,0.12)';
  g.beginPath();
  g.arc(270, 47, 9, 0, TAU);
  g.stroke();
  g.strokeStyle = hot ? '#ff4d6d' : acc;
  g.shadowColor = acc;
  g.shadowBlur = 5;
  g.beginPath();
  g.arc(270, 47, 9, -Math.PI / 2, -Math.PI / 2 + prog * TAU);
  g.stroke();
  g.restore();
  counter(g, 112, 298);
  const top = COUNTER;
  const heat = calm ? 0.12 : 0.45 + 0.25 * Math.sin(t * 3);
  g.save();
  g.shadowColor = acc;
  g.shadowBlur = 6;
  [27, 19, 11].forEach((r) => {
    g.strokeStyle = rgba(hot ? '#ff4d6d' : acc, heat);
    g.lineWidth = 1;
    g.beginPath();
    g.ellipse(208, top + 4, r, r * 0.2, 0, 0, TAU);
    g.stroke();
  });
  g.restore();
  if (!calm) glow(g, 208, top + 4, 30, acc, 0.35);
  const py = 116 + Math.sin(t * 2) * 1.6;
  oval(g, 208, top + 4, 15, 2.4, 'rgba(0,0,0,0.35)');
  shape(
    g,
    `M 186 ${py} L 230 ${py} C 230 ${py + 19} 219 ${py + 25} 208 ${py + 25} C 197 ${py + 25} 186 ${py + 19} 186 ${py} Z`,
    lin(g, 186, py, 230, py + 25, '#ffffff', '#d7ddf0', '#8c97bb'),
  );
  oval(g, 194, py + 9, 2, 6, 'rgba(255,255,255,0.8)', 0.3);
  oval(g, 208, py, 22, 4.4, lin(g, 186, py, 230, py, '#cfd6ec', '#ffffff', '#aab3d0'));
  oval(g, 208, py + 0.4, 19, 3.2, lin(g, 0, py - 3, 0, py + 3, '#ffd29a', '#ff9a4a'));
  if (!calm) {
    glow(g, 208, py, 18, acc, 0.5);
    for (let i = 0; i < 3; i++) {
      const p = (t * 0.45 + i / 3) % 1;
      const sx = 199 + i * 9;
      g.save();
      g.globalAlpha = Math.sin(p * Math.PI) * 0.55;
      g.beginPath();
      g.moveTo(sx, py - 3);
      for (let k = 1; k <= 8; k++)
        g.lineTo(sx + Math.sin(k * 0.9 + t * 2 + i) * 3, py - 3 - k * 4 * (0.4 + p));
      g.strokeStyle = '#f2f5ff';
      g.lineWidth = 2.2;
      g.lineCap = 'round';
      g.lineJoin = 'round';
      g.stroke();
      g.restore();
    }
  }
  const toss = work ? Math.sin(t * 4.2) : 0;
  const hands: Point[] = work
    ? [
        [-21, 16],
        [28, 4 + toss * 5],
      ]
    : [
        [-22, 15],
        [22, 15],
      ];
  const head = being(g, 95, 92, t, mood, acc, { look: 1, hands, phase: 1 });
  if (work) {
    const items: [string, boolean][] = [
      ['#ff5a4e', false],
      ['#7ed957', true],
      ['#ffd34e', false],
    ];
    items.forEach(([hex, isLeaf], i) => {
      const p = (t * 0.55 + i / 3) % 1;
      const x = lerp(124, 206, p);
      const y = lerp(100, py - 2, p) - Math.sin(p * Math.PI) * 42;
      g.save();
      g.globalAlpha = p > 0.92 ? (1 - p) / 0.08 : 1;
      if (isLeaf) leaf(g, x - 4, y, 9, t * 6 + i, hex);
      else oval(g, x, y, 3.6, 3.6, rad(g, x - 1, y - 1, 4.5, '#ffffff', hex, hex));
      g.restore();
    });
  }
  end(g, t, mood, head, '#ffd9b8');
};

const travel: SmoothScene = (g, t, mood) => {
  studio(g, t, mood, ['#22c3ff', '#2ed3b7', '#5b6bff']);
  const work = mood === 'working';
  const calm = mood === 'idle';
  const hot = mood === 'trouble';
  const acc = hot ? '#ff4d6d' : '#2ed3b7';
  glass(g, 18, 20, 84, 38, 9);
  label(g, 'PAR  →  OSA', 27, 34, 7.5);
  label(g, work ? 'in flight · 6 h left' : 'boarding 14:05', 27, 46, 6, 0.5);
  const cx = 210;
  const cy = 90;
  const R = 46;
  glow(g, cx, cy, R * 1.7, acc, calm ? 0.12 : 0.3);
  oval(
    g,
    cx,
    cy,
    R,
    R,
    rad(
      g,
      cx - 14,
      cy - 16,
      R * 1.4,
      'rgba(120,230,255,0.32)',
      'rgba(40,90,160,0.16)',
      'rgba(10,20,50,0.05)',
    ),
  );
  const spin = work ? t * 0.45 : 0.6;
  g.save();
  g.beginPath();
  g.arc(cx, cy, R, 0, TAU);
  g.clip();
  g.lineWidth = 0.6;
  for (let i = 0; i < 6; i++) {
    const a = spin + (i * Math.PI) / 6;
    g.strokeStyle = rgba(acc, 0.12 + 0.18 * Math.abs(Math.sin(a)));
    g.beginPath();
    g.ellipse(cx, cy, Math.abs(Math.cos(a)) * R + 0.01, R, 0, 0, TAU);
    g.stroke();
  }
  for (const k of [-0.66, -0.33, 0, 0.33, 0.66]) {
    const w = R * Math.sqrt(1 - k * k);
    g.strokeStyle = rgba(acc, 0.2);
    g.beginPath();
    g.ellipse(cx, cy + k * R, w, w * 0.14, 0, 0, TAU);
    g.stroke();
  }
  for (let i = 0; i < 90; i++) {
    const lat = (hash(i + 3) - 0.5) * 2.4;
    const lon = hash(i + 7) * TAU;
    const z = Math.cos(lat) * Math.cos(lon + spin);
    if (z < 0) continue;
    const x = cx + R * Math.cos(lat) * Math.sin(lon + spin);
    const y = cy - R * Math.sin(lat);
    oval(g, x, y, 0.9, 0.9, rgba('#bff7ff', 0.25 + z * 0.6));
  }
  g.restore();
  g.save();
  g.strokeStyle = rgba(acc, calm ? 0.35 : 0.85);
  g.shadowColor = acc;
  g.shadowBlur = calm ? 0 : 8;
  g.lineWidth = 1.2;
  g.beginPath();
  g.arc(cx, cy, R, 0, TAU);
  g.stroke();
  g.restore();
  const a: Point = [cx - 26, cy + 16];
  const b: Point = [cx + 24, cy - 18];
  const c: Point = [cx + 2, cy - 52];
  const at = (p: number): Point => [
    (1 - p) * (1 - p) * a[0] + 2 * (1 - p) * p * c[0] + p * p * b[0],
    (1 - p) * (1 - p) * a[1] + 2 * (1 - p) * p * c[1] + p * p * b[1],
  ];
  const prog = work ? (t * 0.28) % 1 : mood === 'waiting' ? 0.5 : calm ? 0 : 0.62;
  g.save();
  g.setLineDash([2, 3]);
  line(
    g,
    Array.from({ length: 21 }, (_, i) => at(i / 20)),
    rgba('#e6f2ff', 0.35),
    0.8,
  );
  g.restore();
  if (prog > 0) {
    const steps = Math.max(1, Math.round(prog * 30));
    g.save();
    g.shadowColor = acc;
    g.shadowBlur = 6;
    line(
      g,
      Array.from({ length: steps + 1 }, (_, i) => at((i / steps) * prog)),
      acc,
      1.6,
    );
    g.restore();
  }
  for (const [px, py] of [a, b]) {
    glow(g, px, py, 7, acc, 0.8);
    oval(g, px, py, 2.2, 2.2, '#ffffff');
  }
  if (!calm) {
    const [px, py] = at(prog);
    const [nx, ny] = at(Math.min(1, prog + 0.02));
    g.save();
    g.translate(px, py);
    g.rotate(Math.atan2(ny - py, nx - px));
    glow(g, 0, 0, 10, '#ffffff', 0.6);
    shape(g, 'M 6 0 L -4 -4 L -2 0 L -4 4 Z', '#ffffff');
    g.restore();
  }
  g.save();
  g.translate(cx, cy);
  g.rotate(-0.35);
  g.strokeStyle = rgba(acc, 0.4);
  g.lineWidth = 0.7;
  g.beginPath();
  g.ellipse(0, 0, R + 14, 11, 0, 0, TAU);
  g.stroke();
  const sa = t * (work ? 1.2 : 0.2);
  oval(g, Math.cos(sa) * (R + 14), Math.sin(sa) * 11, 1.8, 1.8, '#ffffff');
  g.restore();
  const hands: Point[] = work
    ? [
        [-22, 15],
        [28, -4 + Math.sin(t * 2) * 2],
      ]
    : [
        [-22, 15],
        [22, 15],
      ];
  const head = being(g, 90, 96, t, mood, '#2ed3b7', { look: 1, hands, phase: 0.6 });
  end(g, t, mood, head, '#bff7ff');
};

const observation: SmoothScene = (g, t, mood) => {
  studio(g, t, mood, ['#ffb84a', '#ff5f8a', '#4f6bff']);
  const work = mood === 'working';
  const calm = mood === 'idle';
  const hot = mood === 'trouble';
  glass(g, 148, 22, 140, 108, 10);
  const rows: [string, string, number][] = [
    ['CPU', '#ffc24a', 50],
    ['MEMORY', '#2ed3b7', 82],
    ['REQUESTS', '#7aa2ff', 114],
  ];
  const shift = work ? t * 1.6 : 2;
  rows.forEach(([name, hex, cy], r) => {
    label(g, name, 158, cy - 13, 5.5, 0.55);
    const color = hot && r === 1 ? '#ff4d6d' : hex;
    const pts: Point[] = [];
    for (let x = 158; x <= 278; x += 3) {
      const u = x * 0.09 + shift * (1 + r * 0.3);
      let v = Math.sin(u) * 0.5 + Math.sin(u * 2.3 + r) * 0.3 + Math.sin(u * 0.7 + r * 2) * 0.2;
      if (calm) v *= 0.25;
      if (hot && r === 1 && x > 238) v = -1.6 + Math.sin(x) * 0.2;
      pts.push([x, cy + v * 7]);
    }
    g.save();
    g.beginPath();
    g.moveTo(158, cy + 10);
    for (const [x, y] of pts) g.lineTo(x, y);
    g.lineTo(278, cy + 10);
    g.closePath();
    g.fillStyle = lin(g, 0, cy - 10, 0, cy + 10, rgba(color, 0.28), rgba(color, 0));
    g.fill();
    g.restore();
    g.save();
    g.shadowColor = color;
    g.shadowBlur = calm ? 0 : 5;
    line(g, pts, color, 1.2);
    g.restore();
    const lastPoint = pts[pts.length - 1];
    glow(g, lastPoint[0], lastPoint[1], 6, color, calm ? 0.3 : 0.9);
    oval(g, lastPoint[0], lastPoint[1], 1.5, 1.5, '#ffffff');
  });
  if (!calm) {
    const sy = work ? 40 + ((Math.sin(t * 1.3) + 1) / 2) * 80 : mood === 'waiting' ? 82 : 84;
    g.save();
    g.globalCompositeOperation = 'lighter';
    shape(
      g,
      `M 96 78 L 150 ${sy - 18} L 150 ${sy + 18} Z`,
      lin(
        g,
        96,
        0,
        150,
        0,
        rgba(hot ? '#ff4d6d' : '#ffc24a', 0.3),
        rgba(hot ? '#ff4d6d' : '#ffc24a', 0.04),
      ),
    );
    g.restore();
  }
  const head = being(g, 82, 94, t, mood, '#ffc24a', {
    look: 1,
    hands: [
      [-22, 15],
      [24, 10],
    ],
    phase: 1.4,
  });
  end(g, t, mood, head, '#ffe3b0');
};

const analysis: SmoothScene = (g, t, mood) => {
  studio(g, t, mood, ['#a35bff', '#5b7cff', '#ff4fa3']);
  const work = mood === 'working';
  const calm = mood === 'idle';
  const hot = mood === 'trouble';
  counter(g, 130, 298);
  const base = COUNTER + 2;
  const tops: Point[] = [];
  for (let i = 0; i < 5; i++) {
    const x = 160 + i * 25;
    const level = work
      ? 0.5 + 0.5 * Math.sin(t * 1.1 + i * 1.3)
      : [0.35, 0.55, 0.45, 0.75, 0.62][i];
    const h = (calm ? 10 : 18) + level * 46;
    const c1 =
      hot && i === 3 ? '#ff4d6d' : ['#7aa2ff', '#8f8cff', '#a77bff', '#b48cff', '#c98cff'][i];
    box(g, x, base - h, 14, h, 1.5, lin(g, x, base - h, x, base, rgba(c1, 0.95), rgba(c1, 0.25)));
    shape(
      g,
      `M ${x + 14} ${base - h + 1} L ${x + 19} ${base - h - 3} L ${x + 19} ${base - 3} L ${x + 14} ${base} Z`,
      rgba(c1, 0.35),
    );
    shape(
      g,
      `M ${x + 1} ${base - h} L ${x + 6} ${base - h - 4} L ${x + 19} ${base - h - 4} L ${x + 14} ${base - h} Z`,
      rgba('#ffffff', 0.55),
    );
    glow(g, x + 9, base - h - 2, 10, c1, calm ? 0.15 : 0.45);
    tops.push([x + 9, base - h - 10]);
  }
  g.save();
  g.shadowColor = '#ffffff';
  g.shadowBlur = 5;
  line(g, tops, 'rgba(255,255,255,0.85)', 1);
  g.restore();
  for (const [x, y] of tops) oval(g, x, y, 1.6, 1.6, '#ffffff');
  const spin = work ? t * 0.6 : 0.4;
  const parts: [number, string][] = [
    [0.42, '#7aa2ff'],
    [0.28, '#ff4fa3'],
    [0.3, '#2ed3b7'],
  ];
  let start = spin;
  g.save();
  g.lineWidth = 5;
  for (const [share, hex] of parts) {
    g.strokeStyle = hex;
    g.shadowColor = hex;
    g.shadowBlur = calm ? 0 : 4;
    g.beginPath();
    g.arc(262, 42, 14, start + 0.05, start + share * TAU - 0.05);
    g.stroke();
    start += share * TAU;
  }
  g.restore();
  label(g, work ? `${Math.round(60 + 30 * Math.sin(t * 0.5))}%` : '72%', 255, 45, 7);
  const head = being(g, 88, 92, t, mood, '#b48cff', {
    look: 1,
    hands: work
      ? [
          [-22, 15],
          [29, -2 + Math.sin(t * 1.1) * 4],
        ]
      : [
          [-22, 15],
          [22, 15],
        ],
    phase: 2.2,
  });
  end(g, t, mood, head, '#e3d4ff');
};

const CODE: readonly (readonly [number, readonly (readonly [number, string])[]])[] = [
  [
    0,
    [
      [18, '#c792ea'],
      [22, '#82aaff'],
      [8, '#89ddff'],
    ],
  ],
  [
    1,
    [
      [14, '#c792ea'],
      [26, '#ffcb6b'],
    ],
  ],
  [
    1,
    [
      [10, '#82aaff'],
      [20, '#c3e88d'],
      [6, '#89ddff'],
    ],
  ],
  [
    2,
    [
      [22, '#f78c6c'],
      [14, '#c3e88d'],
    ],
  ],
  [
    2,
    [
      [12, '#c792ea'],
      [30, '#82aaff'],
    ],
  ],
  [1, [[8, '#89ddff']]],
  [
    1,
    [
      [16, '#c792ea'],
      [18, '#ffcb6b'],
      [10, '#c3e88d'],
    ],
  ],
  [0, [[6, '#89ddff']]],
];

const coding: SmoothScene = (g, t, mood) => {
  studio(g, t, mood, ['#2ed3b7', '#5b7cff', '#a35bff']);
  const work = mood === 'working';
  const calm = mood === 'idle';
  const hot = mood === 'trouble';
  glass(g, 152, 20, 136, 100, 10);
  [0, 1, 2].forEach((i) => oval(g, 162 + i * 7, 29, 2, 2, ['#ff5f57', '#febc2e', '#28c840'][i]));
  const typed = work ? (t * 6) % (CODE.length * 10 + 12) : CODE.length * 10 - 14;
  let cursor: Point = [168, 42];
  CODE.forEach(([indent, parts], row) => {
    const y = 42 + row * 9.5;
    label(g, String(row + 1), 158, y + 2, 5, 0.3);
    let x = 168 + indent * 8;
    const shown = clamp((typed - row * 10) / 10, 0, 1);
    if (shown <= 0) return;
    let budget = shown * parts.reduce((sum, [w]) => sum + w + 3, 0);
    for (const [w, hex] of parts) {
      const width = Math.min(w, budget);
      if (width <= 0) break;
      box(g, x, y - 1.5, width, 3, 1.5, hot && row === 4 ? '#ff4d6d' : hex);
      x += width + 3;
      budget -= w + 3;
    }
    cursor = [x, y];
  });
  if (!calm && Math.floor(t * 2) % 2 === 0)
    box(g, cursor[0], cursor[1] - 3.5, 1.4, 7, 0.5, '#e6f2ff');
  if (hot) {
    g.save();
    g.strokeStyle = '#ff4d6d';
    g.lineWidth = 0.8;
    g.beginPath();
    for (let x = 184; x < 236; x += 3) g.lineTo(x, 84 + (x % 6 ? 1 : -1));
    g.stroke();
    g.restore();
  }
  const kx = 52;
  const ky = 124;
  shape(
    g,
    `M ${kx + 10} ${ky} L ${kx + 110} ${ky} L ${kx + 120} ${ky + 14} L ${kx} ${ky + 14} Z`,
    'rgba(120,255,220,0.08)',
    rgba('#7cf2c8', 0.5),
    0.7,
  );
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 12; c++) {
      const inset = 10 - r * 3.3;
      const x = kx + inset + 3 + c * ((120 - inset * 2 - 4) / 12);
      const y = ky + 2 + r * 4;
      const lit = work && hash(Math.floor(t * 9) * 31 + r * 12 + c) > 0.82;
      box(g, x, y, 6.5, 2.8, 0.8, lit ? '#d8fff2' : rgba('#7cf2c8', calm ? 0.12 : 0.3));
      if (lit) glow(g, x + 3, y + 1.4, 5, '#7cf2c8', 0.8);
    }
  const tap = (k: number): number => (work ? Math.abs(Math.sin(t * 9 + k * 1.7)) * -4 : 0);
  const head = being(g, 112, 90, t, mood, '#7cf2c8', {
    look: 1,
    hands: calm
      ? [
          [-22, 15],
          [22, 15],
        ]
      : [
          [-24, 28 + tap(0)],
          [24, 28 + tap(1)],
        ],
    phase: 0.3,
  });
  end(g, t, mood, head, '#c8fff0');
};

const security: SmoothScene = (g, t, mood) => {
  studio(g, t, mood, ['#19c99a', '#2a7dff', '#6a4cff']);
  const work = mood === 'working';
  const calm = mood === 'idle';
  const hot = mood === 'trouble';
  const acc = hot ? '#ff4d6d' : '#2ee6a6';
  const cx = 214;
  const cy = 92;
  const R = 56;
  const s = 9.2;
  const sweep = 150 + ((t * 55) % 140);
  const hexPath = (x: number, y: number, r: number): void => {
    g.beginPath();
    for (let k = 0; k < 6; k++) {
      const a = Math.PI / 6 + (k * TAU) / 6;
      g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r);
    }
    g.closePath();
  };
  g.save();
  hexPath(cx, cy, R);
  g.fillStyle = rgba(acc, calm ? 0.03 : 0.07);
  g.fill();
  for (let q = -4; q <= 4; q++)
    for (let r = -4; r <= 4; r++) {
      const x = cx + s * Math.sqrt(3) * (q + r / 2);
      const y = cy + s * 1.5 * r;
      if (Math.hypot(x - cx, y - cy) > R - 7) continue;
      const near = work ? Math.max(0, 1 - Math.abs(x - sweep) / 18) : 0;
      const flick = hot ? (hash(Math.floor(t * 8) + q * 9 + r) > 0.6 ? 0.6 : 0.1) : 0;
      hexPath(x, y, s - 1.2);
      g.strokeStyle = rgba(acc, (calm ? 0.12 : 0.28) + near * 0.6 + flick);
      g.lineWidth = 0.8;
      g.stroke();
      if (near > 0.3) {
        g.fillStyle = rgba(acc, near * 0.18);
        g.fill();
      }
    }
  g.shadowColor = acc;
  g.shadowBlur = calm ? 0 : 8;
  hexPath(cx, cy, R);
  g.strokeStyle = rgba(acc, calm ? 0.3 : 0.9);
  g.lineWidth = 1.4;
  g.stroke();
  g.restore();
  if (hot) {
    g.save();
    g.shadowColor = '#ff4d6d';
    g.shadowBlur = 5;
    line(
      g,
      [
        [cx - 6, cy - 30],
        [cx + 2, cy - 14],
        [cx - 5, cy - 2],
        [cx + 8, cy + 12],
        [cx + 2, cy + 26],
      ],
      'rgba(255,120,135,0.9)',
      1,
    );
    line(
      g,
      [
        [cx + 2, cy - 14],
        [cx + 16, cy - 20],
      ],
      'rgba(255,120,135,0.8)',
      0.8,
    );
    g.restore();
  }
  if (!calm)
    for (let i = 0; i < 4; i++) {
      const lane = 64 + i * 19;
      const bad = i === 2;
      const p = (t * 0.22 + i / 4) % 1;
      let x = 318 - p * 230;
      let alpha = 1;
      let color = '#cdd8ff';
      if (mood === 'waiting') {
        x = i === 1 ? 262 : 318 - ((t * 0.08 + i / 4) % 1) * 40 + 30;
        color = i === 1 ? '#ffd166' : '#cdd8ff';
      } else if (x < 262) {
        if (bad || hot) {
          const back = 262 - x;
          x = 262 + back * 0.35;
          color = '#ff4d6d';
          alpha = clamp(1 - back / 50, 0, 1);
        } else {
          color = '#2ee6a6';
          alpha = clamp((x - 130) / 50, 0, 1);
        }
      }
      g.save();
      g.globalAlpha = alpha;
      g.shadowColor = color;
      g.shadowBlur = 6;
      box(g, x - 7, lane - 3, 14, 6, 3, color);
      g.shadowBlur = 0;
      g.fillStyle = 'rgba(10,14,30,0.55)';
      g.fillRect(x - 3, lane - 0.6, 6, 1.2);
      g.restore();
    }
  if (!calm) {
    g.save();
    g.shadowColor = acc;
    g.shadowBlur = 8;
    line(
      g,
      [
        [113, 94],
        [cx - R + 4, cy],
      ],
      rgba(acc, 0.55 + 0.25 * Math.sin(t * 6)),
      1.6,
    );
    g.restore();
  }
  const head = being(g, 85, 92, t, mood, '#2ee6a6', {
    look: 1,
    hands: calm
      ? [
          [-22, 15],
          [22, 15],
        ]
      : [
          [-22, 16],
          [28, 2],
        ],
    phase: 2,
  });
  end(g, t, mood, head, '#bdfbe6');
};

export const NEURAL: Readonly<Record<string, SmoothScene>> = {
  assistant,
  kitchen,
  travel,
  observation,
  analysis,
  coding,
  security,
};
