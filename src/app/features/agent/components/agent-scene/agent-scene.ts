import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  effect,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import { CastStore } from '@shell/application/cast.store';
import type { CastId } from '@shell/domain/agent-cast';
import type { AgentMood } from '../../domain/agent-activity';
import {
  frameAt,
  SpriteSheets,
  type SpriteSheet,
} from '../../infrastructure/sprites/sprite-sheets';
import { FRAME_MS, HEIGHT, WIDTH } from './pixel-frame';
import { isDrawnCast, loadCast, paint, type DrawnCast } from './pixel-scenes';
import {
  SMOOTH_SIZE,
  drawSmooth,
  isSmoothCast,
  loadSmoothCast,
  smoothScenes,
} from './smooth/smooth-scenes';

type Tick = (frame: number, seconds: number) => void;

const SMOOTH_MS = 33;
const STILL_SECONDS = 2.2;
const ticks = new Set<Tick>();
let running = 0;

function loop(time: number): void {
  const frame = Math.floor(time / FRAME_MS);
  for (const tick of ticks) tick(frame, time / 1000);
  running = ticks.size ? requestAnimationFrame(loop) : 0;
}

function listen(tick: Tick): () => void {
  ticks.add(tick);
  if (!running && typeof requestAnimationFrame === 'function')
    running = requestAnimationFrame(loop);
  return () => ticks.delete(tick);
}

function drawn(cast: CastId): DrawnCast {
  return isDrawnCast(cast) ? cast : 'homelab';
}

@Component({
  selector: 'app-agent-scene',
  template: `<canvas #canvas role="img" [attr.aria-label]="label()"></canvas>`,
  styleUrl: './agent-scene.scss',
  host: { '[class.agent-scene--smooth]': 'smooth()' },
})
export class AgentScene {
  readonly agent = input.required<string>();
  readonly mood = input<AgentMood>('idle');
  readonly label = input('');
  readonly cast = input<CastId | null>(null);

  private readonly casts = inject(CastStore);
  private readonly sprites = inject(SpriteSheets);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private readonly activeCast = computed<CastId>(() => this.cast() ?? this.casts.active());
  protected readonly smooth = computed(() => isSmoothCast(this.activeCast()));
  private context: CanvasRenderingContext2D | null = null;
  private sheet: SpriteSheet | null = null;
  private frame = 0;
  private seconds = STILL_SECONDS;
  private drawnAt = -1;
  private visible = true;

  constructor() {
    const destroyRef = inject(DestroyRef);
    effect(() => {
      const agent = this.agent();
      const cast = this.activeCast();
      untracked(() => this.load(agent, cast));
    });
    effect(() => {
      this.mood();
      this.activeCast();
      untracked(() => this.render());
    });
    afterNextRender(() => {
      const element = this.canvas().nativeElement;
      try {
        this.context = element.getContext('2d');
      } catch {
        this.context = null;
      }
      this.render();
      const still = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      if (still) return;
      let observer: IntersectionObserver | null = null;
      if (typeof IntersectionObserver === 'function') {
        observer = new IntersectionObserver(([entry]) => (this.visible = entry.isIntersecting));
        observer.observe(element);
      }
      const stop = listen((frame, seconds) => this.tick(frame, seconds));
      destroyRef.onDestroy(() => {
        stop();
        observer?.disconnect();
      });
    });
  }

  private tick(frame: number, seconds: number): void {
    if (!this.visible) return;
    if (this.smooth() && smoothScenes(this.smoothCast())) {
      if (seconds * 1000 - this.drawnAt < SMOOTH_MS) return;
      this.seconds = seconds;
      this.render();
      return;
    }
    if (frame === this.frame) return;
    this.frame = frame;
    this.render();
  }

  private smoothCast() {
    const cast = this.activeCast();
    return isSmoothCast(cast) ? cast : 'neural';
  }

  private load(agent: string, cast: CastId): void {
    this.sheet = null;
    const ready = () => {
      if (this.activeCast() === cast) this.render();
    };
    if (isSmoothCast(cast)) {
      void loadSmoothCast(cast).then(ready);
      return;
    }
    void loadCast(drawn(cast)).then(ready);
    if (cast !== 'sprites') return;
    void this.sprites.load(agent).then((sheet) => {
      if (this.agent() !== agent || this.activeCast() !== 'sprites') return;
      this.sheet = sheet;
      this.render();
    });
  }

  private render(): void {
    const context = this.context;
    if (!context) return;
    if (this.smooth() && this.renderSmooth(context)) return;
    const canvas = context.canvas;
    const sheet = this.activeCast() === 'sprites' ? this.sheet : null;
    const width = sheet?.frameWidth ?? WIDTH;
    const height = sheet?.frameHeight ?? HEIGHT;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    context.setTransform(1, 0, 0, 1, 0, 0);
    if (sheet) {
      const { x, y } = frameAt(sheet, this.mood(), this.frame);
      context.imageSmoothingEnabled = false;
      context.clearRect(0, 0, width, height);
      context.drawImage(sheet.image, x, y, width, height, 0, 0, width, height);
      return;
    }
    const pixels = paint(this.agent(), this.mood(), this.frame, drawn(this.activeCast()));
    context.putImageData(new ImageData(pixels.bytes(), WIDTH, HEIGHT), 0, 0);
  }

  private renderSmooth(context: CanvasRenderingContext2D): boolean {
    const cast = this.smoothCast();
    if (!smoothScenes(cast)) return false;
    const canvas = context.canvas;
    const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
    const width = Math.max(SMOOTH_SIZE.width, Math.round((canvas.clientWidth || 0) * ratio));
    const height = Math.round((width * SMOOTH_SIZE.height) / SMOOTH_SIZE.width);
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const scale = width / SMOOTH_SIZE.width;
    context.setTransform(scale, 0, 0, scale, 0, 0);
    context.imageSmoothingEnabled = true;
    context.clearRect(0, 0, SMOOTH_SIZE.width, SMOOTH_SIZE.height);
    drawSmooth(context, this.agent(), this.mood(), this.seconds, cast);
    context.setTransform(1, 0, 0, 1, 0, 0);
    this.drawnAt = this.seconds * 1000;
    return true;
  }
}
