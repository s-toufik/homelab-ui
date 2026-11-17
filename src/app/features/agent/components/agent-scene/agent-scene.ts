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

type Tick = (frame: number) => void;

const ticks = new Set<Tick>();
let running = 0;
let lastFrame = -1;

function loop(time: number): void {
  const frame = Math.floor(time / FRAME_MS);
  if (frame !== lastFrame) {
    lastFrame = frame;
    for (const tick of ticks) tick(frame);
  }
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
  private context: CanvasRenderingContext2D | null = null;
  private sheet: SpriteSheet | null = null;
  private frame = 0;
  private visible = true;

  constructor() {
    const destroyRef = inject(DestroyRef);
    effect(() => {
      const agent = this.agent();
      const cast = this.activeCast();
      untracked(() => this.loadSheet(agent, cast));
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
      const stop = listen((frame) => {
        this.frame = frame;
        if (this.visible) this.render();
      });
      destroyRef.onDestroy(() => {
        stop();
        observer?.disconnect();
      });
    });
  }

  private loadSheet(agent: string, cast: CastId): void {
    this.sheet = null;
    void loadCast(drawn(cast)).then(() => {
      if (this.activeCast() === cast) this.render();
    });
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
    const canvas = context.canvas;
    const sheet = this.activeCast() === 'sprites' ? this.sheet : null;
    const width = sheet?.frameWidth ?? WIDTH;
    const height = sheet?.frameHeight ?? HEIGHT;
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
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
}
