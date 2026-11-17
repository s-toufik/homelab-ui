export const WIDTH = 96;
export const HEIGHT = 64;
export const FRAME_MS = 125;

const BAYER: readonly (readonly number[])[] = [
  [0, 8, 2, 10],
  [12, 4, 14, 6],
  [3, 11, 1, 9],
  [15, 7, 13, 5],
];

export type Color = number;

export function color(hex: string): Color {
  const value = parseInt(hex.replace('#', ''), 16);
  const r = (value >> 16) & 255;
  const g = (value >> 8) & 255;
  const b = value & 255;
  return ((255 << 24) | (b << 16) | (g << 8) | r) >>> 0;
}

export function palette<K extends string>(colors: Record<K, string>): Record<K, Color> {
  const out = {} as Record<K, Color>;
  for (const key of Object.keys(colors) as K[]) out[key] = color(colors[key]);
  return out;
}

export class PixelFrame {
  readonly pixels = new Uint32Array(WIDTH * HEIGHT);
  private target = this.pixels;

  set(x: number, y: number, c: Color): void {
    x = Math.round(x);
    y = Math.round(y);
    if (x < 0 || y < 0 || x >= WIDTH || y >= HEIGHT) return;
    this.target[y * WIDTH + x] = c;
  }

  get(x: number, y: number): Color {
    return this.pixels[y * WIDTH + x];
  }

  rect(x: number, y: number, w: number, h: number, c: Color): void {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) this.set(x + i, y + j, c);
  }

  ellipse(cx: number, cy: number, rx: number, ry: number, c: Color): void {
    for (let y = Math.floor(cy - ry); y <= Math.ceil(cy + ry); y++)
      for (let x = Math.floor(cx - rx); x <= Math.ceil(cx + rx); x++) {
        const dx = (x + 0.5 - cx) / rx;
        const dy = (y + 0.5 - cy) / ry;
        if (dx * dx + dy * dy <= 1) this.set(x, y, c);
      }
  }

  line(x0: number, y0: number, x1: number, y1: number, c: Color, thickness = 1): void {
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = -Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let error = dx + dy;
    for (;;) {
      this.rect(x0, y0, thickness, thickness, c);
      if (x0 === x1 && y0 === y1) return;
      const twice = 2 * error;
      if (twice >= dy) {
        error += dy;
        x0 += sx;
      }
      if (twice <= dx) {
        error += dx;
        y0 += sy;
      }
    }
  }

  dither(
    x: number,
    y: number,
    w: number,
    h: number,
    a: Color,
    b: Color,
    amount: (i: number, j: number) => number,
  ): void {
    for (let j = 0; j < h; j++)
      for (let i = 0; i < w; i++)
        this.set(x + i, y + j, ordered(x + i, y + j) < amount(i, j) ? b : a);
  }

  speckle(x: number, y: number, c: Color, amount: number): void {
    if (ordered(x, y) < amount) this.set(x, y, c);
  }

  sprite(draw: () => void, outline: Color): void {
    const layer = new Uint32Array(WIDTH * HEIGHT);
    this.target = layer;
    try {
      draw();
    } finally {
      this.target = this.pixels;
    }
    for (let y = 0; y < HEIGHT; y++)
      for (let x = 0; x < WIDTH; x++) {
        const index = y * WIDTH + x;
        if (layer[index]) {
          this.pixels[index] = layer[index];
          continue;
        }
        const near =
          (x > 0 && layer[index - 1]) ||
          (x < WIDTH - 1 && layer[index + 1]) ||
          (y > 0 && layer[index - WIDTH]) ||
          (y < HEIGHT - 1 && layer[index + WIDTH]);
        if (near) this.pixels[index] = outline;
      }
  }

  letterZ(x: number, y: number, c: Color): void {
    this.rect(x, y, 4, 1, c);
    this.set(x + 2, y + 1, c);
    this.set(x + 1, y + 2, c);
    this.rect(x, y + 3, 4, 1, c);
  }

  bubble(x: number, y: number, mark: '?' | '!', ink: Color, paper: Color): void {
    this.rect(x, y, 7, 7, paper);
    this.rect(x + 1, y - 1, 5, 1, paper);
    this.rect(x + 1, y + 7, 5, 1, paper);
    this.set(x + 1, y + 8, paper);
    this.set(x, y + 9, paper);
    if (mark === '!') {
      this.rect(x + 3, y + 1, 1, 3, ink);
      this.set(x + 3, y + 5, ink);
    } else {
      this.rect(x + 2, y + 1, 3, 1, ink);
      this.set(x + 5, y + 2, ink);
      this.set(x + 4, y + 3, ink);
      this.set(x + 3, y + 4, ink);
      this.set(x + 3, y + 6, ink);
    }
  }

  bytes(): Uint8ClampedArray<ArrayBuffer> {
    return new Uint8ClampedArray(this.pixels.buffer as ArrayBuffer);
  }
}

function ordered(x: number, y: number): number {
  return (BAYER[y & 3][x & 3] + 0.5) / 16;
}
