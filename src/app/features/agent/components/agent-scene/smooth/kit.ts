import type { AgentMood } from '../../../domain/agent-activity';

export const W = 300;
export const H = 200;
export const TAU = Math.PI * 2;

export type Ctx = CanvasRenderingContext2D;
export type Point = [number, number];
export type SmoothScene = (g: Ctx, t: number, mood: AgentMood) => void;
export type ArmSpec = readonly [number, number] | { readonly to: Point; readonly bend?: number };
export interface Limb {
  readonly elbow: Point;
  readonly hand: Point;
}
export interface Hands {
  readonly back: Point;
  readonly front: Point;
  readonly b: number;
  readonly sway: number;
}

export function rgba(hex: string, a: number): string {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${a})`;
}

export function lin(
  g: Ctx,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  ...stops: string[]
): CanvasGradient {
  const r = g.createLinearGradient(x0, y0, x1, y1);
  stops.forEach((c, i) => r.addColorStop(i / (stops.length - 1), c));
  return r;
}

export function rad(g: Ctx, x: number, y: number, r: number, ...stops: string[]): CanvasGradient {
  const gr = g.createRadialGradient(x, y, 0, x, y, r);
  stops.forEach((c, i) => gr.addColorStop(i / (stops.length - 1), c));
  return gr;
}

export function orb(g: Ctx, x: number, y: number, r: number, hex: string, rim = 0.55): void {
  g.beginPath();
  g.arc(x, y, r, 0, TAU);
  const gr = g.createRadialGradient(x - r * 0.4, y - r * 0.45, 0.5, x, y, r);
  gr.addColorStop(0, '#ffffff');
  gr.addColorStop(0.35, hex);
  gr.addColorStop(1, rgba(hex, rim));
  g.fillStyle = gr;
  g.fill();
}

type Fill = string | CanvasGradient;

export function oval(
  g: Ctx,
  x: number,
  y: number,
  rx: number,
  ry: number,
  fill: Fill,
  rot = 0,
): void {
  g.beginPath();
  g.ellipse(x, y, Math.max(rx, 0.01), Math.max(ry, 0.01), rot, 0, TAU);
  g.fillStyle = fill;
  g.fill();
}

export function shape(g: Ctx, d: string, fill: Fill | null, stroke?: Fill, width = 1): Path2D {
  const p = new Path2D(d);
  if (fill) {
    g.fillStyle = fill;
    g.fill(p);
  }
  if (stroke) {
    g.strokeStyle = stroke;
    g.lineWidth = width;
    g.stroke(p);
  }
  return p;
}

export function line(g: Ctx, pts: readonly Point[], stroke: Fill, width: number): void {
  g.beginPath();
  g.moveTo(pts[0][0], pts[0][1]);
  for (const p of pts.slice(1)) g.lineTo(p[0], p[1]);
  g.strokeStyle = stroke;
  g.lineWidth = width;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.stroke();
}

export function box(
  g: Ctx,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
  fill: Fill,
): void {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
  g.fillStyle = fill;
  g.fill();
}

export function blob(
  g: Ctx,
  x: number,
  y: number,
  rx: number,
  ry: number,
  hex: string,
  a: number,
): void {
  g.save();
  g.translate(x, y);
  g.scale(1, ry / rx);
  g.beginPath();
  g.arc(0, 0, rx, 0, TAU);
  g.fillStyle = rad(g, 0, 0, rx, rgba(hex, a), rgba(hex, a * 0.35), rgba(hex, 0));
  g.fill();
  g.restore();
}

export function glow(g: Ctx, x: number, y: number, r: number, hex: string, a = 1): void {
  g.save();
  g.globalCompositeOperation = 'lighter';
  blob(g, x, y, r, r, hex, a);
  g.restore();
}

export function leaf(g: Ctx, x: number, y: number, len: number, ang: number, fill: Fill): void {
  g.save();
  g.translate(x, y);
  g.rotate(ang);
  g.beginPath();
  g.moveTo(0, 0);
  g.quadraticCurveTo(len * 0.5, -len * 0.42, len, 0);
  g.quadraticCurveTo(len * 0.5, len * 0.42, 0, 0);
  g.fillStyle = fill;
  g.fill();
  g.restore();
}

export function hash(n: number): number {
  const x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

export const lerp = (a: number, b: number, p: number): number => a + (b - a) * p;
export const ease = (p: number): number => (p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2);
export const clamp = (v: number, a: number, b: number): number => Math.min(b, Math.max(a, v));

export function limb(
  [sx, sy]: Point,
  [a1, a2]: readonly [number, number],
  l1: number,
  l2: number,
): Limb {
  const ex = sx + Math.sin(a1) * l1;
  const ey = sy + Math.cos(a1) * l1;
  return {
    elbow: [ex, ey],
    hand: [ex + Math.sin(a1 + a2) * l2, ey + Math.cos(a1 + a2) * l2],
  };
}

export function reach([sx, sy]: Point, [tx, ty]: Point, l1: number, l2: number, bend = 1): Limb {
  const dx = tx - sx;
  const dy = ty - sy;
  const full = Math.hypot(dx, dy) || 0.01;
  const d = clamp(full, 0.01, l1 + l2 - 0.01);
  const base = Math.atan2(dy, dx);
  const a = Math.acos(clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1));
  const ex = sx + Math.cos(base + a * bend) * l1;
  const ey = sy + Math.sin(base + a * bend) * l1;
  const k = d / full;
  return { elbow: [ex, ey], hand: [sx + dx * k, sy + dy * k] };
}

export function pose(s: Point, spec: ArmSpec, l1: number, l2: number): Limb {
  return 'to' in spec
    ? reach(s, spec.to, l1, l2, spec.bend ?? 1)
    : limb(s, spec as readonly [number, number], l1, l2);
}

export function steam(g: Ctx, x: number, y: number, t: number, n = 3, spread = 8, a = 0.5): void {
  for (let i = 0; i < n; i++) {
    const p = (t * 0.4 + i / n) % 1;
    const sx = x + (i - (n - 1) / 2) * spread;
    g.save();
    g.globalAlpha = Math.sin(p * Math.PI) * a;
    g.beginPath();
    g.moveTo(sx, y);
    for (let k = 1; k <= 8; k++)
      g.lineTo(sx + Math.sin(k * 0.9 + t * 2 + i) * 3, y - k * 4 * (0.45 + p));
    g.strokeStyle = '#ffffff';
    g.lineWidth = 2.4;
    g.lineCap = 'round';
    g.lineJoin = 'round';
    g.stroke();
    g.restore();
  }
}

export function fire(g: Ctx, x: number, y: number, t: number, mood: AgentMood, k = 1): void {
  const calm = mood === 'idle';
  glow(g, x, y - 8 * k, 30 * k, '#ffae4a', calm ? 0.25 : 0.55);
  line(
    g,
    [
      [x - 13 * k, y],
      [x + 11 * k, y - 4 * k],
    ],
    '#4a2e1a',
    4 * k,
  );
  line(
    g,
    [
      [x - 11 * k, y - 4 * k],
      [x + 13 * k, y],
    ],
    '#5c3a20',
    4 * k,
  );
  const flames: readonly [number, number, number, string, number][] = [
    [-6, 15, 6, '#ff5a1f', 0],
    [6, 13, 5, '#ff5a1f', 1.7],
    [0, 22, 7.5, '#ff8f1f', 0.8],
    [-1, 13, 4.2, '#ffd55a', 2.2],
    [2, 8, 2.6, '#fff3b0', 3.1],
  ];
  for (const [dx, h0, w0, c, ph] of flames) {
    const f = calm ? 0.35 : 1 + 0.18 * Math.sin(t * 9 + ph) + 0.1 * Math.sin(t * 13 + ph * 2);
    const h = h0 * f * k;
    const w = w0 * k;
    const fx = x + dx * k;
    const lean = Math.sin(t * 5 + ph) * 2.2 * k;
    shape(
      g,
      `M ${fx - w} ${y - 2 * k} C ${fx - w} ${y - h * 0.55} ${fx + lean * 0.5} ${y - h * 0.75} ${fx + lean} ${y - h} C ${fx + lean * 0.4} ${y - h * 0.6} ${fx + w} ${y - h * 0.5} ${fx + w} ${y - 2 * k} Z`,
      c,
    );
  }
  if (!calm)
    for (let i = 0; i < 5; i++) {
      const p = (t * 0.6 + i / 5) % 1;
      oval(
        g,
        x + Math.sin(p * 8 + i) * 6 * k,
        y - 10 * k - p * 40 * k,
        0.9,
        0.9,
        rgba('#ffcf6a', 1 - p),
      );
    }
}

export function smoke(g: Ctx, x: number, y: number, t: number, hex = '#3a3436'): void {
  for (let i = 0; i < 6; i++) {
    const p = (t * 0.28 + i / 6) % 1;
    blob(
      g,
      x + Math.sin(p * 5 + i) * 6 + p * 10,
      y - p * 46,
      5 + p * 13,
      5 + p * 11,
      hex,
      0.55 * (1 - p),
    );
  }
}

function zzz(g: Ctx, x: number, y: number, t: number, color: string): void {
  g.save();
  g.fillStyle = color;
  for (let i = 0; i < 3; i++) {
    const p = (t * 0.3 + i / 3) % 1;
    g.globalAlpha = Math.sin(p * Math.PI) * 0.95;
    g.font = `700 ${6 + p * 8}px system-ui, sans-serif`;
    g.fillText('z', x + p * 12 + Math.sin(p * 7) * 2, y - p * 30);
  }
  g.restore();
}

export interface BubbleStyle {
  readonly paper: string;
  readonly ink: string;
  readonly edge?: string;
}

function bubble(g: Ctx, x: number, y: number, mark: string, t: number, s: BubbleStyle): void {
  y += Math.sin(t * 3) * 1.2;
  g.save();
  g.beginPath();
  g.roundRect(x - 10, y - 22, 20, 18, 7);
  g.moveTo(x - 4, y - 5);
  g.lineTo(x - 8, y + 2);
  g.lineTo(x + 2, y - 5);
  g.closePath();
  g.shadowColor = 'rgba(0,0,0,0.35)';
  g.shadowBlur = 5;
  g.shadowOffsetY = 1;
  g.fillStyle = s.paper;
  g.fill();
  g.shadowColor = 'transparent';
  if (s.edge) {
    g.strokeStyle = s.edge;
    g.lineWidth = 0.8;
    g.stroke();
  }
  g.fillStyle = s.ink;
  g.font = '700 13px system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(mark, x, y - 12.5);
  g.restore();
}

export function dusk(g: Ctx, hex: string, a: number): void {
  g.save();
  g.globalCompositeOperation = 'multiply';
  g.fillStyle = rgba(hex, a);
  g.fillRect(0, 0, W, H);
  g.restore();
}

function alarm(g: Ctx, t: number, hex = '#ff2d3d'): void {
  const f = 0.55 + 0.45 * Math.abs(Math.sin(t * 3.5));
  g.save();
  const r = g.createRadialGradient(W / 2, H / 2, 50, W / 2, H / 2, 190);
  r.addColorStop(0, rgba(hex, 0));
  r.addColorStop(1, rgba(hex, 0.42 * f));
  g.fillStyle = r;
  g.fillRect(0, 0, W, H);
  g.restore();
}

export interface Finish {
  readonly head: Point;
  readonly bubble: BubbleStyle;
  readonly z?: string;
  readonly night?: string;
  readonly lights?: readonly (readonly [number, number, number, string])[];
  readonly afterDark?: (g: Ctx) => void;
  readonly trouble?: (g: Ctx) => void;
}

export function finish(g: Ctx, t: number, mood: AgentMood, o: Finish): void {
  const [hx, hy] = o.head;
  if (mood === 'idle') {
    dusk(g, o.night ?? '#232a55', 0.6);
    for (const [x, y, r, hex] of o.lights ?? []) glow(g, x, y, r, hex, 0.3);
    o.afterDark?.(g);
    zzz(g, hx + 8, hy - 4, t, o.z ?? '#eef1ff');
  }
  if (mood === 'waiting') bubble(g, hx + 15, hy - 4, '?', t, o.bubble);
  if (mood === 'trouble') {
    o.trouble?.(g);
    alarm(g, t);
    bubble(g, hx + 15, hy - 4, '!', t, { ...o.bubble, ink: '#d61f3a' });
  }
}
