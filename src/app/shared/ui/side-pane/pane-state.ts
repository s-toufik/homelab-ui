import { computed, signal } from '@angular/core';

export interface PaneOptions {
  readonly key: string;
  readonly width: number;
  readonly min: number;
  readonly max: number;
  readonly pinned: boolean;
  readonly storage?: Storage | null;
}

export const PEEK_OPEN_DELAY = 90;
export const PEEK_CLOSE_DELAY = 320;

function defaultStorage(): Storage | null {
  try {
    return globalThis.localStorage ?? null;
  } catch {
    return null;
  }
}

function read(storage: Storage | null, key: string): string | null {
  try {
    return storage?.getItem(key) ?? null;
  } catch {
    return null;
  }
}

function write(storage: Storage | null, key: string, value: string): void {
  try {
    storage?.setItem(key, value);
  } catch {
    return;
  }
}

export function clampPaneWidth(width: number, min: number, max: number): number {
  return Math.round(Math.min(Math.max(width, min), max));
}

export class PaneState {
  private readonly storage: Storage | null;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private readonly pinnedState = signal(false);
  private readonly peekingState = signal(false);
  private readonly widthState = signal(0);

  readonly pinned = this.pinnedState.asReadonly();
  readonly peeking = this.peekingState.asReadonly();
  readonly width = this.widthState.asReadonly();
  readonly open = computed(() => this.pinnedState() || this.peekingState());
  readonly resizing = signal(false);

  constructor(private readonly options: PaneOptions) {
    this.storage = options.storage === undefined ? defaultStorage() : options.storage;
    const pinned = read(this.storage, `${options.key}.pinned`);
    this.pinnedState.set(pinned === null ? options.pinned : pinned === 'true');
    const width = Number(read(this.storage, `${options.key}.width`));
    this.widthState.set(
      clampPaneWidth(width > 0 ? width : options.width, options.min, options.max),
    );
  }

  get min(): number {
    return this.options.min;
  }

  get max(): number {
    return this.options.max;
  }

  togglePin(): void {
    this.setPinned(!this.pinnedState());
  }

  setPinned(pinned: boolean, remember = true): void {
    this.clearTimer();
    this.pinnedState.set(pinned);
    this.peekingState.set(false);
    if (remember) write(this.storage, `${this.options.key}.pinned`, String(pinned));
  }

  hover(on: boolean): void {
    this.clearTimer();
    if (this.pinnedState() || on === this.peekingState()) return;
    this.timer = setTimeout(
      () => {
        this.timer = null;
        this.peekingState.set(on);
      },
      on ? PEEK_OPEN_DELAY : PEEK_CLOSE_DELAY,
    );
  }

  hide(): void {
    this.clearTimer();
    this.peekingState.set(false);
  }

  resize(width: number): void {
    this.widthState.set(clampPaneWidth(width, this.options.min, this.options.max));
  }

  saveWidth(): void {
    write(this.storage, `${this.options.key}.width`, String(this.widthState()));
  }

  resetWidth(): void {
    this.resize(this.options.width);
    this.saveWidth();
  }

  private clearTimer(): void {
    if (this.timer !== null) clearTimeout(this.timer);
    this.timer = null;
  }
}
