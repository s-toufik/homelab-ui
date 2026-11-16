import type { Hue } from '../domain/homelab-feature';

export type Vector = readonly [x: number, y: number, z: number];

export interface View {
  readonly yaw: number;
  readonly pitch: number;
  readonly zoom: number;
  readonly panX: number;
  readonly panY: number;
}

export interface SkyStar {
  readonly id: string;
  readonly label: string;
  readonly description: string;
  readonly path: string;
  readonly query?: Record<string, string>;
  readonly hue: Hue;
  readonly lon: number;
  readonly lat: number;
  readonly magnitude: number;
  readonly constellation: string;
}

export interface Constellation {
  readonly id: string;
  readonly name: string;
  readonly hue: Hue;
  readonly lon: number;
  readonly lat: number;
  readonly stars: readonly SkyStar[];
  readonly lines: readonly (readonly [number, number])[];
}

export interface ConstellationInput {
  readonly id: string;
  readonly name: string;
  readonly hue: Hue;
  readonly stars: readonly Omit<SkyStar, 'lon' | 'lat' | 'constellation' | 'magnitude'>[];
}

export const MIN_ZOOM = 0.55;
export const MAX_ZOOM = 9;
const DEG = Math.PI / 180;
const GOLDEN = 137.508 * DEG;

const PLACES: readonly (readonly [lon: number, lat: number])[] = [
  [0, 16],
  [74, 34],
  [146, -14],
  [218, 30],
  [290, -22],
  [36, -48],
  [180, 58],
  [254, -56],
];

export function toVector(lon: number, lat: number): Vector {
  const l = lon * DEG;
  const p = lat * DEG;
  return [Math.cos(p) * Math.cos(l), Math.sin(p), Math.cos(p) * Math.sin(l)];
}

export function rotate([x, y, z]: Vector, yaw: number, pitch: number): Vector {
  const x1 = x * Math.cos(yaw) - z * Math.sin(yaw);
  const z1 = x * Math.sin(yaw) + z * Math.cos(yaw);
  const y2 = y * Math.cos(pitch) - z1 * Math.sin(pitch);
  const z2 = y * Math.sin(pitch) + z1 * Math.cos(pitch);
  return [x1, y2, z2];
}

export function radius(width: number, height: number, zoom: number): number {
  return Math.min(width, height) * (width < 600 ? 0.47 : 0.42) * zoom;
}

export function project(
  vector: Vector,
  view: View,
  width: number,
  height: number,
): { x: number; y: number; depth: number } {
  const [x, y, z] = rotate(vector, view.yaw, view.pitch);
  const r = radius(width, height, view.zoom);
  return { x: width / 2 + view.panX + x * r, y: height / 2 + view.panY - y * r, depth: z };
}

export function facing(lon: number, lat: number): { yaw: number; pitch: number } {
  const [x, y, z] = toVector(lon, lat);
  return { yaw: Math.atan2(x, z), pitch: Math.atan2(y, Math.hypot(x, z)) };
}

export function clampZoom(zoom: number): number {
  return Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, zoom));
}

export function clampPitch(pitch: number): number {
  return Math.max(-Math.PI / 2, Math.min(Math.PI / 2, pitch));
}

export function zoomAt(
  view: View,
  factor: number,
  pointerX: number,
  pointerY: number,
  width: number,
  height: number,
): View {
  const zoom = clampZoom(view.zoom * factor);
  const ratio = zoom / view.zoom;
  const centerX = width / 2 + view.panX;
  const centerY = height / 2 + view.panY;
  const nextX = pointerX - (pointerX - centerX) * ratio;
  const nextY = pointerY - (pointerY - centerY) * ratio;
  return { ...view, zoom, panX: nextX - width / 2, panY: nextY - height / 2 };
}

export function shortestAngle(from: number, to: number): number {
  let delta = (to - from) % (2 * Math.PI);
  if (delta > Math.PI) delta -= 2 * Math.PI;
  if (delta < -Math.PI) delta += 2 * Math.PI;
  return from + delta;
}

export function layout(inputs: readonly ConstellationInput[]): Constellation[] {
  return inputs.map((input, index) => {
    const [lon, lat] = PLACES[index % PLACES.length];
    const stars: SkyStar[] = input.stars.map((star, i) => {
      const spread = i === 0 ? 0 : 7 + 5.5 * Math.sqrt(i);
      const angle = i * GOLDEN;
      const starLat = Math.max(-80, Math.min(80, lat + spread * Math.sin(angle)));
      const starLon = lon + (spread * Math.cos(angle)) / Math.max(0.3, Math.cos(lat * DEG));
      return {
        ...star,
        lon: starLon,
        lat: starLat,
        magnitude: i === 0 ? 1 : 0.62 + (0.3 * ((i * 7) % 5)) / 4,
        constellation: input.id,
      };
    });
    return { ...input, lon, lat, stars, lines: figure(stars, lon, lat) };
  });
}

function figure(
  stars: readonly SkyStar[],
  lon: number,
  lat: number,
): (readonly [number, number])[] {
  if (stars.length < 2) return [];
  const around = stars
    .map((star, index) => ({ index, angle: Math.atan2(star.lat - lat, star.lon - lon) }))
    .slice(1)
    .sort((a, b) => a.angle - b.angle);
  const lines: [number, number][] = [[0, around[0].index]];
  for (let i = 1; i < around.length; i++) lines.push([around[i - 1].index, around[i].index]);
  if (around.length > 3) lines.push([0, around[Math.floor(around.length / 2)].index]);
  return lines;
}

export interface FieldStar {
  readonly vector: Vector;
  readonly size: number;
  readonly alpha: number;
  readonly warm: boolean;
}

export function starField(count: number, seed = 7): FieldStar[] {
  const random = mulberry32(seed);
  const stars: FieldStar[] = [];
  for (let i = 0; i < count; i++) {
    const lon = random() * 360;
    const lat = Math.asin(2 * random() - 1) / DEG;
    const bright = random();
    stars.push({
      vector: toVector(lon, lat),
      size: bright > 0.97 ? 1.6 : bright > 0.85 ? 1.1 : 0.7,
      alpha: 0.25 + bright * 0.6,
      warm: random() > 0.8,
    });
  }
  const band = mulberry32(seed + 1);
  for (let i = 0; i < count * 1.6; i++) {
    const along = band() * 360;
    const off = (band() + band() + band() - 1.5) * 9;
    const tilt = 62 * DEG;
    const base = toVector(along, off);
    const vector: Vector = [
      base[0],
      base[1] * Math.cos(tilt) - base[2] * Math.sin(tilt),
      base[1] * Math.sin(tilt) + base[2] * Math.cos(tilt),
    ];
    stars.push({ vector, size: 0.55, alpha: 0.12 + band() * 0.22, warm: false });
  }
  return stars;
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
