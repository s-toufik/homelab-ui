import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  effect,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import type { AgentMood } from '../../domain/agent-activity';
import { FRAME_MS, HEIGHT, WIDTH } from './pixel-frame';
import { paint } from './pixel-scenes';

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

@Component({
  selector: 'app-agent-scene',
  template: `<canvas
    #canvas
    [attr.width]="width"
    [attr.height]="height"
    role="img"
    [attr.aria-label]="label()"
  ></canvas>`,
  styleUrl: './agent-scene.scss',
})
export class AgentScene {
  readonly agent = input.required<string>();
  readonly mood = input<AgentMood>('idle');
  readonly label = input('');

  protected readonly width = WIDTH;
  protected readonly height = HEIGHT;
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private context: CanvasRenderingContext2D | null = null;
  private frame = 0;
  private visible = true;

  constructor() {
    const destroyRef = inject(DestroyRef);
    effect(() => {
      const agent = this.agent();
      const mood = this.mood();
      untracked(() => this.render(agent, mood));
    });
    afterNextRender(() => {
      const element = this.canvas().nativeElement;
      try {
        this.context = element.getContext('2d');
      } catch {
        this.context = null;
      }
      this.render(this.agent(), this.mood());
      const still = matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
      if (still) return;
      let observer: IntersectionObserver | null = null;
      if (typeof IntersectionObserver === 'function') {
        observer = new IntersectionObserver(([entry]) => (this.visible = entry.isIntersecting));
        observer.observe(element);
      }
      const stop = listen((frame) => {
        this.frame = frame;
        if (this.visible) this.render(this.agent(), this.mood());
      });
      destroyRef.onDestroy(() => {
        stop();
        observer?.disconnect();
      });
    });
  }

  private render(agent: string, mood: AgentMood): void {
    if (!this.context) return;
    const image = new ImageData(paint(agent, mood, this.frame).bytes(), WIDTH, HEIGHT);
    this.context.putImageData(image, 0, 0);
  }
}
