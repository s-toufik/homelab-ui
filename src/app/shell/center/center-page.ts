import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AccessStore } from '../application/access.store';
import { ASSISTANT_PANEL } from '../application/assistant-panel';
import { AppsStore } from '../application/apps.store';
import { NavigationStore } from '../application/navigation.store';
import type { Hue } from '../domain/homelab-feature';
import {
  clampPitch,
  clampZoom,
  facing,
  layout,
  project,
  radius,
  shortestAngle,
  galaxy,
  starField,
  STAR_TONES,
  toVector,
  zoomAt,
  type Constellation,
  type ConstellationInput,
  type SkyStar,
  type View,
} from './sky';

const SECTION_HUES: Readonly<Record<string, Hue>> = {
  Observe: 'green',
  Operate: 'blue',
  Automate: 'purple',
};
const IDLE_SPIN = 0.00006;
const LABEL_ZOOM = 1.45;
const HIT_RADIUS = 16;
const DEGREE = Math.PI / 180;

function tint(color: string, alpha: number): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!hex) return color;
  const value = parseInt(hex[1], 16);
  return `rgba(${value >> 16}, ${(value >> 8) & 255}, ${value & 255}, ${alpha})`;
}

function lighten(color: string, weight: number): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!hex) return color;
  const value = parseInt(hex[1], 16);
  const channel = (shift: number) =>
    Math.round(((value >> shift) & 255) * (1 - weight) + 255 * weight)
      .toString(16)
      .padStart(2, '0');
  return `#${channel(16)}${channel(8)}${channel(0)}`;
}

const WARM = '255, 217, 168';
const COOL = '185, 200, 255';
const puffs = new Map<string, HTMLCanvasElement>();

function channels(color: string): string {
  const hex = /^#([0-9a-f]{6})$/i.exec(color.trim());
  if (!hex) return '0, 0, 0';
  const value = parseInt(hex[1], 16);
  return `${value >> 16}, ${(value >> 8) & 255}, ${value & 255}`;
}

function puff(tone: string): HTMLCanvasElement {
  let sprite = puffs.get(tone);
  if (!sprite) {
    sprite = document.createElement('canvas');
    sprite.width = sprite.height = 32;
    const context = sprite.getContext('2d');
    if (context) {
      const glow = context.createRadialGradient(16, 16, 0, 16, 16, 16);
      glow.addColorStop(0, `rgba(${tone}, 1)`);
      glow.addColorStop(0.45, `rgba(${tone}, 0.45)`);
      glow.addColorStop(1, `rgba(${tone}, 0)`);
      context.fillStyle = glow;
      context.fillRect(0, 0, 32, 32);
    }
    puffs.set(tone, sprite);
  }
  return sprite;
}

function spacing(context: CanvasRenderingContext2D, pixels: number): void {
  if ('letterSpacing' in context) context.letterSpacing = `${pixels}px`;
}

interface Placed {
  readonly star: SkyStar;
  readonly x: number;
  readonly y: number;
  readonly depth: number;
}

interface Flight {
  readonly from: View;
  readonly to: View;
  readonly start: number;
  readonly duration: number;
}

@Component({
  selector: 'app-center-page',
  imports: [RouterLink],
  templateUrl: './center-page.html',
  styleUrl: './center-page.scss',
})
export class CenterPage {
  private readonly router = inject(Router);
  private readonly apps = inject(AppsStore);
  private readonly nav = inject(NavigationStore);
  private readonly access = inject(AccessStore);
  private readonly assistant = inject(ASSISTANT_PANEL, { optional: true });
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('sky');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly constellations = computed<Constellation[]>(() => {
    const inputs: ConstellationInput[] = [
      {
        id: 'assistant',
        name: 'Assistant',
        hue: 'indigo',
        stars: [
          {
            id: 'assistant',
            label: 'Assistant',
            description: 'Conversations with the homelab’s assistants',
            path: '/assistant',
            hue: 'indigo',
          },
          {
            id: 'agents',
            label: 'Agents',
            description: 'Who is working, and who is asking whom',
            path: '/agents',
            hue: 'indigo',
          },
          ...this.apps
            .agents()
            .filter((agent) => agent.id !== 'agent-supervisor')
            .map((agent) => ({
              id: agent.id,
              label: agent.label,
              description: agent.tagline,
              path: agent.path,
              hue: agent.hue,
            })),
        ],
      },
      ...this.nav.sections().map((entry) => ({
        id: entry.section.toLowerCase(),
        name: entry.section,
        hue: SECTION_HUES[entry.section] ?? 'slate',
        stars: entry.pages.map((page) => ({
          id: page.id,
          label: page.label,
          description: page.tagline,
          path: page.path,
          hue: page.hue,
        })),
      })),
      {
        id: 'home',
        name: 'Home',
        hue: 'amber',
        stars: [
          {
            id: 'today',
            label: 'Today',
            description: 'The day at a glance',
            path: '/today',
            hue: 'amber',
          },
          ...(this.access.isAdmin()
            ? [
                {
                  id: 'map',
                  label: 'Map',
                  description: 'The cluster, live',
                  path: '/map',
                  hue: 'teal' as Hue,
                },
                {
                  id: 'people',
                  label: 'People',
                  description: 'Accounts and their pages',
                  path: '/people',
                  hue: 'rose' as Hue,
                },
              ]
            : []),
          {
            id: 'account',
            label: 'Account',
            description: 'Profile, password and sessions',
            path: '/account',
            hue: 'slate',
          },
          {
            id: 'appearance',
            label: 'Appearance',
            description: 'Themes',
            path: '/appearance',
            hue: 'purple',
          },
        ],
      },
    ];
    return layout(inputs.filter((input) => input.stars.length > 0));
  });

  protected readonly selected = signal<SkyStar | null>(null);
  protected readonly hovered = signal<SkyStar | null>(null);
  protected readonly zoom = signal(1);
  protected readonly waiting = computed(() => this.assistant?.waiting() ?? 0);

  private view: View = { ...facing(37, 24), zoom: 1, panX: 0, panY: 0 };
  private flight: Flight | null = null;
  private readonly field = starField(1300);
  private readonly galaxy = galaxy(1500);
  private placed: Placed[] = [];
  private width = 0;
  private height = 0;
  private frame = 0;
  private lastInteraction = 0;
  private velocity = { yaw: 0, pitch: 0 };
  private readonly pointers = new Map<number, { x: number; y: number }>();
  private dragged = 0;
  private pinch: { distance: number; x: number; y: number } | null = null;
  private colors: Record<string, string> = {};
  private reducedMotion = false;

  constructor() {
    const destroyRef = inject(DestroyRef);
    void this.apps.load();
    effect(() => {
      this.constellations();
      untracked(() => this.requestDraw());
    });
    afterNextRender(() => {
      this.reducedMotion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      this.readColors();
      this.resize();
      const observer =
        typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(() => this.resize());
      observer?.observe(this.host.nativeElement);
      const themeWatch = new MutationObserver(() => {
        this.readColors();
        this.requestDraw();
      });
      themeWatch.observe(document.documentElement, { attributeFilter: ['data-theme'] });
      const loop = (time: number) => {
        this.tick(time);
        this.frame = requestAnimationFrame(loop);
      };
      this.frame = requestAnimationFrame(loop);
      destroyRef.onDestroy(() => {
        cancelAnimationFrame(this.frame);
        observer?.disconnect();
        themeWatch.disconnect();
      });
    });
  }

  protected fly(constellation: Constellation): void {
    this.selected.set(null);
    this.flyTo(constellation.lon, constellation.lat, 2.2);
  }

  protected pick(star: SkyStar): void {
    this.selected.set(star);
    this.flyTo(star.lon, star.lat, Math.max(this.view.zoom, 2.8));
  }

  protected constellationName(id: string): string {
    return this.constellations().find((c) => c.id === id)?.name ?? id;
  }

  protected open(star: SkyStar): void {
    void this.router.navigateByUrl(star.path);
  }

  protected reset(): void {
    this.selected.set(null);
    this.flyTo(37, 24, 1);
  }

  protected zoomBy(factor: number): void {
    this.flight = null;
    this.setView(
      zoomAt(this.view, factor, this.width / 2, this.height / 2, this.width, this.height),
    );
    this.touch();
  }

  protected onKey(event: KeyboardEvent): void {
    const step = 0.12 / this.view.zoom;
    const moves: Record<string, () => void> = {
      ArrowLeft: () => this.setView({ ...this.view, yaw: this.view.yaw + step }),
      ArrowRight: () => this.setView({ ...this.view, yaw: this.view.yaw - step }),
      ArrowUp: () => this.setView({ ...this.view, pitch: clampPitch(this.view.pitch + step) }),
      ArrowDown: () => this.setView({ ...this.view, pitch: clampPitch(this.view.pitch - step) }),
      '+': () => this.zoomBy(1.25),
      '=': () => this.zoomBy(1.25),
      '-': () => this.zoomBy(0.8),
      '0': () => this.reset(),
      Escape: () => this.selected.set(null),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    this.flight = null;
    move();
    this.touch();
  }

  protected onDown(event: PointerEvent): void {
    const canvas = this.canvas().nativeElement;
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      // A synthetic pointer: dragging still works while it stays on the sky.
    }
    this.pointers.set(event.pointerId, this.local(event));
    this.dragged = 0;
    this.flight = null;
    this.velocity = { yaw: 0, pitch: 0 };
    if (this.pointers.size === 2) this.pinch = this.pinchState();
    this.touch();
  }

  protected onMove(event: PointerEvent): void {
    const point = this.local(event);
    const previous = this.pointers.get(event.pointerId);
    if (!previous) {
      this.hovered.set(this.hit(point.x, point.y));
      this.canvas().nativeElement.style.cursor = this.hovered() ? 'pointer' : 'grab';
      return;
    }
    this.pointers.set(event.pointerId, point);
    if (this.pointers.size === 2 && this.pinch) {
      const next = this.pinchState();
      const zoomed = zoomAt(
        this.view,
        next.distance / this.pinch.distance,
        next.x,
        next.y,
        this.width,
        this.height,
      );
      this.setView({
        ...zoomed,
        panX: zoomed.panX + next.x - this.pinch.x,
        panY: zoomed.panY + next.y - this.pinch.y,
      });
      this.pinch = next;
      this.dragged += 10;
      return;
    }
    const dx = point.x - previous.x;
    const dy = point.y - previous.y;
    this.dragged += Math.abs(dx) + Math.abs(dy);
    if (event.shiftKey || event.buttons === 2 || event.buttons === 4) {
      this.setView({ ...this.view, panX: this.view.panX + dx, panY: this.view.panY + dy });
    } else {
      const r = radius(this.width, this.height, this.view.zoom);
      const yaw = -dx / r;
      const pitch = dy / r;
      this.velocity = { yaw, pitch };
      this.setView({
        ...this.view,
        yaw: this.view.yaw + yaw,
        pitch: clampPitch(this.view.pitch + pitch),
      });
    }
    this.canvas().nativeElement.style.cursor = 'grabbing';
    this.touch();
  }

  protected onUp(event: PointerEvent): void {
    const point = this.local(event);
    this.pointers.delete(event.pointerId);
    if (this.pointers.size < 2) this.pinch = null;
    if (this.dragged < 5 && this.pointers.size === 0) {
      const star = this.hit(point.x, point.y);
      if (star) this.pick(star);
      else this.selected.set(null);
      this.velocity = { yaw: 0, pitch: 0 };
    }
    this.canvas().nativeElement.style.cursor = 'grab';
  }

  protected onDoubleClick(event: MouseEvent): void {
    const point = this.local(event);
    const star = this.hit(point.x, point.y);
    if (star) {
      this.open(star);
      return;
    }
    this.setView(zoomAt(this.view, 1.8, point.x, point.y, this.width, this.height));
    this.touch();
  }

  protected onWheel(event: WheelEvent): void {
    event.preventDefault();
    const point = this.local(event);
    const factor = Math.exp(-Math.max(-1, Math.min(1, event.deltaY * 0.0022)));
    this.flight = null;
    this.setView(zoomAt(this.view, factor, point.x, point.y, this.width, this.height));
    this.touch();
  }

  private flyTo(lon: number, lat: number, zoom: number): void {
    const target = facing(lon, lat);
    this.flight = {
      from: this.view,
      to: {
        yaw: shortestAngle(this.view.yaw, target.yaw),
        pitch: clampPitch(target.pitch),
        zoom: clampZoom(zoom),
        panX: 0,
        panY: 0,
      },
      start: performance.now(),
      duration: this.reducedMotion ? 1 : 900,
    };
    this.touch();
  }

  private tick(time: number): void {
    if (this.flight) {
      const t = Math.min(1, (time - this.flight.start) / this.flight.duration);
      const ease = 1 - Math.pow(1 - t, 3);
      const { from, to } = this.flight;
      this.setView({
        yaw: from.yaw + (to.yaw - from.yaw) * ease,
        pitch: from.pitch + (to.pitch - from.pitch) * ease,
        zoom: from.zoom * Math.pow(to.zoom / from.zoom, ease),
        panX: from.panX + (to.panX - from.panX) * ease,
        panY: from.panY + (to.panY - from.panY) * ease,
      });
      if (t >= 1) this.flight = null;
    } else if (this.pointers.size === 0) {
      const moving = Math.abs(this.velocity.yaw) + Math.abs(this.velocity.pitch) > 0.00005;
      if (moving && !this.reducedMotion) {
        this.setView({
          ...this.view,
          yaw: this.view.yaw + this.velocity.yaw,
          pitch: clampPitch(this.view.pitch + this.velocity.pitch),
        });
        this.velocity = { yaw: this.velocity.yaw * 0.93, pitch: this.velocity.pitch * 0.93 };
      } else if (!this.reducedMotion && time - this.lastInteraction > 6000 && !this.selected()) {
        this.setView({ ...this.view, yaw: this.view.yaw - IDLE_SPIN * 16 });
      }
    }
    this.draw(time);
  }

  private setView(view: View): void {
    this.view = view;
    if (Math.abs(this.zoom() - view.zoom) > 0.01) this.zoom.set(view.zoom);
  }

  private touch(): void {
    this.lastInteraction = performance.now();
  }

  private requestDraw(): void {
    if (this.width) this.draw(performance.now());
  }

  private resize(): void {
    const canvas = this.canvas().nativeElement;
    const box = this.host.nativeElement.getBoundingClientRect();
    const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
    this.width = Math.max(1, box.width);
    this.height = Math.max(1, box.height);
    canvas.width = Math.round(this.width * ratio);
    canvas.height = Math.round(this.height * ratio);
    canvas.style.width = `${this.width}px`;
    canvas.style.height = `${this.height}px`;
    try {
      canvas.getContext('2d')?.setTransform(ratio, 0, 0, ratio, 0, 0);
    } catch {
      return;
    }
    this.requestDraw();
  }

  private readColors(): void {
    const style = getComputedStyle(this.host.nativeElement);
    const read = (name: string) => style.getPropertyValue(name).trim();
    this.colors = {
      text: read('--text') || '#e6edf3',
      muted: read('--text-muted') || '#8e9bac',
      accent: read('--accent') || '#58a6ff',
      font: read('--font-sans') || 'sans-serif',
      caps: read('--font-caps') || read('--font-sans') || 'sans-serif',
      skyHigh: read('--sky-high') || '#1a2550',
      skyMid: read('--sky-mid') || '#0b1230',
      skyDeep: read('--sky-deep') || '#03060f',
    };
    for (const hue of [
      'orange',
      'teal',
      'indigo',
      'purple',
      'blue',
      'green',
      'rose',
      'amber',
      'slate',
    ])
      this.colors[hue] = read(`--hue-${hue}`) || '#8c9eff';
  }

  private draw(time: number): void {
    if (!this.width) return;
    let context: CanvasRenderingContext2D | null = null;
    try {
      context = this.canvas().nativeElement.getContext('2d');
    } catch {
      return;
    }
    if (!context) return;
    const { width, height, view } = this;
    const c = this.colors;
    const r = radius(width, height, view.zoom);
    const cx = width / 2 + view.panX;
    const cy = height / 2 + view.panY;
    context.clearRect(0, 0, width, height);

    const glow = context.createRadialGradient(cx, cy, r * 0.92, cx, cy, r * 1.24);
    glow.addColorStop(0, tint(c['accent'], 0.24));
    glow.addColorStop(1, tint(c['accent'], 0));
    context.fillStyle = glow;
    context.beginPath();
    context.arc(cx, cy, r * 1.24, 0, Math.PI * 2);
    context.fill();

    const sky = context.createRadialGradient(cx - r * 0.3, cy - r * 0.35, r * 0.1, cx, cy, r);
    sky.addColorStop(0, c['skyHigh']);
    sky.addColorStop(0.6, c['skyMid']);
    sky.addColorStop(1, c['skyDeep']);
    context.fillStyle = sky;
    context.beginPath();
    context.arc(cx, cy, r, 0, Math.PI * 2);
    context.fill();

    context.save();
    context.beginPath();
    context.arc(cx, cy, r, 0, Math.PI * 2);
    context.clip();

    context.strokeStyle = 'rgba(185, 200, 255, 0.06)';
    context.lineWidth = 1;
    for (let lat = -60; lat <= 60; lat += 30) this.drawCurve(context, (t) => [t * 360, lat]);
    for (let lon = 0; lon < 360; lon += 30) this.drawCurve(context, (t) => [lon, t * 180 - 90]);

    context.globalCompositeOperation = 'lighter';
    for (const cloud of this.galaxy.clouds) {
      const [x, y, z] = this.rotated(cloud.vector);
      if (z <= 0) continue;
      const size = cloud.size * r * 2.6;
      context.globalAlpha = Math.min(1, cloud.alpha * 1.4 * Math.min(1, z * 2));
      context.drawImage(
        puff(cloud.warm ? WARM : COOL),
        cx + x * r - size / 2,
        cy - y * r - size / 2,
        size,
        size,
      );
    }
    context.globalCompositeOperation = 'source-over';
    const dark = puff(channels(c['skyDeep']));
    for (const dust of this.galaxy.dust) {
      const [x, y, z] = this.rotated(dust.vector);
      if (z <= 0) continue;
      const size = dust.size * r * 2.4;
      context.globalAlpha = Math.min(1, dust.alpha * 1.6 * z);
      context.drawImage(dark, cx + x * r - size / 2, cy - y * r - size / 2, size, size);
    }

    const grow = Math.min(2.2, Math.sqrt(view.zoom));
    for (const star of this.field) {
      const [x, y, z] = this.rotated(star.vector);
      if (z <= 0) continue;
      const twinkle = this.reducedMotion ? 1 : 0.78 + 0.22 * Math.sin(time / 650 + star.phase);
      context.globalAlpha = star.alpha * Math.min(1, z * 1.8) * twinkle;
      context.fillStyle = STAR_TONES[star.tone];
      const size = star.size * grow;
      const sx = cx + x * r;
      const sy = cy - y * r;
      context.beginPath();
      context.arc(sx, sy, size / 2 + 0.2, 0, Math.PI * 2);
      context.fill();
      if (star.spikes) {
        context.globalAlpha *= 0.5;
        context.fillRect(sx - size * 4, sy - 0.4, size * 8, 0.8);
        context.fillRect(sx - 0.4, sy - size * 4, 0.8, size * 8);
      }
    }
    context.globalAlpha = 1;

    const placed: Placed[] = [];
    const showLabels = view.zoom >= LABEL_ZOOM;
    for (const constellation of this.constellations()) {
      const base = c[constellation.hue] ?? '#8c9eff';
      const color = lighten(base, 0.5);
      const points = constellation.stars.map((star) => ({
        star,
        ...project(toVector(star.lon, star.lat), view, width, height),
      }));
      context.strokeStyle = color;
      context.lineWidth = 1;
      for (const [a, b] of constellation.lines) {
        const from = points[a];
        const to = points[b];
        if (from.depth <= 0 || to.depth <= 0) continue;
        context.globalAlpha = 0.42 * Math.min(1, Math.min(from.depth, to.depth) * 3);
        context.beginPath();
        context.moveTo(from.x, from.y);
        context.lineTo(to.x, to.y);
        context.stroke();
      }
      context.globalAlpha = 1;
      for (const point of points) {
        if (point.depth <= 0) continue;
        placed.push(point);
        const starColor = lighten(c[point.star.hue] ?? base, 0.5);
        const fade = Math.min(1, point.depth * 3);
        const size =
          (1.8 + 2.2 * point.star.magnitude) * Math.min(2.4, 0.75 + Math.sqrt(view.zoom) * 0.45);
        const active =
          this.hovered()?.id === point.star.id || this.selected()?.id === point.star.id;
        const pulse =
          point.star.id === 'assistant' && this.waiting() && !this.reducedMotion
            ? 1 + 0.35 * Math.sin(time / 260)
            : 1;
        const reach = size * (active ? 6.5 : 4.5) * pulse;
        const halo = context.createRadialGradient(point.x, point.y, 0, point.x, point.y, reach);
        halo.addColorStop(0, tint(starColor, 0.6 * fade));
        halo.addColorStop(1, tint(starColor, 0));
        context.fillStyle = halo;
        context.beginPath();
        context.arc(point.x, point.y, reach, 0, Math.PI * 2);
        context.fill();
        context.globalAlpha = fade;
        context.fillStyle = '#ffffff';
        context.beginPath();
        context.arc(point.x, point.y, size * 0.5, 0, Math.PI * 2);
        context.fill();
        if (showLabels || active || point.star.magnitude === 1) {
          context.globalAlpha = fade * (showLabels || active ? 0.95 : 0.8);
          context.fillStyle = '#e9edff';
          context.font = `${point.star.magnitude === 1 ? 600 : 500} ${Math.round(
            10 + Math.min(4, view.zoom),
          )}px ${c['caps']}`;
          spacing(context, 1);
          context.textAlign = 'left';
          context.fillText(point.star.label.toUpperCase(), point.x + size + 6, point.y + 4);
          spacing(context, 0);
        }
      }
      const center = project(toVector(constellation.lon, constellation.lat), view, width, height);
      if (center.depth > 0.15) {
        context.globalAlpha = Math.min(1, center.depth * 2) * (showLabels ? 0.5 : 0.8);
        context.fillStyle = color;
        context.font = `600 ${Math.round(11 + Math.min(6, view.zoom * 1.5))}px ${c['caps']}`;
        spacing(context, 4);
        context.textAlign = 'center';
        context.fillText(constellation.name.toUpperCase(), center.x, center.y - 22 - view.zoom * 6);
        spacing(context, 0);
      }
      context.globalAlpha = 1;
    }

    const limb = context.createRadialGradient(cx, cy, r * 0.8, cx, cy, r);
    limb.addColorStop(0, 'rgba(0, 0, 0, 0)');
    limb.addColorStop(1, tint(lighten(c['accent'], 0.4), 0.32));
    context.fillStyle = limb;
    context.fillRect(cx - r, cy - r, r * 2, r * 2);
    context.restore();

    context.strokeStyle = c['text'];
    context.lineWidth = 1;
    context.globalAlpha = 0.4;
    context.beginPath();
    context.arc(cx, cy, r * 1.05, 0, Math.PI * 2);
    context.stroke();
    for (let degree = 0; degree < 360; degree += 5) {
      const angle = degree * DEGREE + view.yaw;
      const long = degree % 45 === 0;
      const outer = r * (long ? 1.095 : 1.07);
      context.globalAlpha = long ? 0.75 : 0.35;
      context.beginPath();
      context.moveTo(cx + Math.cos(angle) * r * 1.05, cy + Math.sin(angle) * r * 1.05);
      context.lineTo(cx + Math.cos(angle) * outer, cy + Math.sin(angle) * outer);
      context.stroke();
    }
    context.globalAlpha = 1;
    this.placed = placed;
  }

  private drawCurve(context: CanvasRenderingContext2D, at: (t: number) => [number, number]): void {
    context.beginPath();
    let drawing = false;
    for (let i = 0; i <= 72; i++) {
      const [lon, lat] = at(i / 72);
      const point = project(toVector(lon, lat), this.view, this.width, this.height);
      if (point.depth <= 0) {
        drawing = false;
        continue;
      }
      if (drawing) context.lineTo(point.x, point.y);
      else context.moveTo(point.x, point.y);
      drawing = true;
    }
    context.stroke();
  }

  private rotated(vector: readonly [number, number, number]): [number, number, number] {
    const { yaw, pitch } = this.view;
    const [x, y, z] = vector;
    const x1 = x * Math.cos(yaw) - z * Math.sin(yaw);
    const z1 = x * Math.sin(yaw) + z * Math.cos(yaw);
    return [
      x1,
      y * Math.cos(pitch) - z1 * Math.sin(pitch),
      y * Math.sin(pitch) + z1 * Math.cos(pitch),
    ];
  }

  private hit(x: number, y: number): SkyStar | null {
    let best: Placed | null = null;
    let bestDistance = HIT_RADIUS;
    for (const point of this.placed) {
      const distance = Math.hypot(point.x - x, point.y - y);
      if (distance < bestDistance) {
        best = point;
        bestDistance = distance;
      }
    }
    return best?.star ?? null;
  }

  private local(event: MouseEvent): { x: number; y: number } {
    const box = this.canvas().nativeElement.getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  private pinchState(): { distance: number; x: number; y: number } {
    const [a, b] = [...this.pointers.values()];
    return {
      distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)),
      x: (a.x + b.x) / 2,
      y: (a.y + b.y) / 2,
    };
  }
}
