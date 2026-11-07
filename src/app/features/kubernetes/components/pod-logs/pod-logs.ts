import {
  Component,
  DestroyRef,
  ElementRef,
  afterRenderEffect,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { KubeApiService } from '../../infrastructure/api/kube-api.service';

const MAX_CHARS = 400_000;

@Component({
  selector: 'app-pod-logs',
  imports: [FormsModule],
  template: `
    <div class="hl-row pod-logs__bar">
      <label class="pod-logs__check"
        ><input type="checkbox" [ngModel]="previous()" (ngModelChange)="previous.set($event)" />
        Previous run</label
      >
      <input
        class="hl-input pod-logs__filter"
        placeholder="Filter lines"
        aria-label="Filter lines"
        [ngModel]="filter()"
        (ngModelChange)="filter.set($event)"
      />
      @if (following()) {
        <button type="button" class="hl-btn hl-btn--small hl-btn--primary" (click)="stop()">
          Following · stop
        </button>
      } @else {
        <button
          type="button"
          class="hl-btn hl-btn--small"
          [disabled]="previous()"
          (click)="follow()"
        >
          Follow
        </button>
        <button type="button" class="hl-btn hl-btn--small" (click)="load()">Reload</button>
      }
    </div>
    @if (error(); as error) {
      <p class="hl-error">{{ error }}</p>
    }
    <pre #view class="hl-pre pod-logs__text">{{ shown() }}</pre>
  `,
  styles: `
    .pod-logs__bar {
      margin-bottom: 0.5rem;
    }
    .pod-logs__check {
      display: inline-flex;
      gap: 0.35rem;
      align-items: center;
      font-size: 0.82rem;
      color: var(--text-muted);
    }
    .pod-logs__filter {
      flex: 1 1 10rem;
    }
    .pod-logs__text {
      height: 28rem;
      white-space: pre-wrap;
      word-break: break-all;
    }
  `,
})
export class PodLogs {
  readonly namespace = input.required<string>();
  readonly pod = input.required<string>();
  readonly container = input.required<string>();

  private readonly api = inject(KubeApiService);
  private readonly view = viewChild<ElementRef<HTMLPreElement>>('view');
  protected readonly text = signal('');
  protected readonly filter = signal('');
  protected readonly previous = signal(false);
  protected readonly following = signal(false);
  protected readonly error = signal<string | null>(null);
  private abort: AbortController | null = null;

  protected shown(): string {
    const needle = this.filter().trim().toLowerCase();
    if (!needle) return this.text();
    return this.text()
      .split('\n')
      .filter((line) => line.toLowerCase().includes(needle))
      .join('\n');
  }

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
    effect(() => {
      this.pod();
      this.container();
      this.previous();
      this.stop();
      void this.load();
    });
    afterRenderEffect(() => {
      this.text();
      const element = this.view()?.nativeElement;
      if (element) element.scrollTop = element.scrollHeight;
    });
  }

  protected async load(): Promise<void> {
    this.error.set(null);
    try {
      this.text.set(
        await this.api.logs(this.namespace(), this.pod(), this.container(), this.previous()),
      );
    } catch (error) {
      this.text.set('');
      this.error.set((error as Error).message);
    }
  }

  protected follow(): void {
    this.stop();
    this.text.set('');
    this.following.set(true);
    this.abort = new AbortController();
    this.api
      .followLogs(
        this.namespace(),
        this.pod(),
        this.container(),
        (chunk) => this.text.update((t) => (t + chunk).slice(-MAX_CHARS)),
        this.abort.signal,
      )
      .catch((error) => {
        if ((error as Error).name !== 'AbortError') this.error.set((error as Error).message);
      })
      .finally(() => this.following.set(false));
  }

  protected stop(): void {
    this.abort?.abort();
    this.abort = null;
    this.following.set(false);
  }
}
