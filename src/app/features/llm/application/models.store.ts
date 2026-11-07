import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import type { LlmModel, PromptAnswer } from '../domain/model';
import { LlmApiService } from '../infrastructure/api/llm-api.service';

const MAX_LOG_CHARS = 200_000;

@Injectable({ providedIn: 'root' })
export class ModelsStore {
  private readonly api = inject(LlmApiService);

  readonly models = signal<LlmModel[]>([]);
  readonly error = signal<string | null>(null);
  readonly busy = signal<string | null>(null);
  readonly loaded = computed(() => this.models().filter((model) => model.state !== 'stopped'));

  readonly promptModel = signal('');
  readonly promptText = signal('');
  readonly answer = signal<PromptAnswer | null>(null);
  readonly prompting = signal(false);
  readonly promptError = signal<string | null>(null);

  readonly logs = signal('');
  readonly following = signal(false);
  private logAbort: AbortController | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopLogs());
  }

  async load(): Promise<void> {
    try {
      this.models.set(await this.api.models());
      this.error.set(null);
      if (!this.promptModel())
        this.promptModel.set(this.loaded()[0]?.id ?? this.models()[0]?.id ?? '');
    } catch (error) {
      this.error.set((error as Error).message);
    }
  }

  async warmUp(model: string): Promise<void> {
    await this.run(model, async () => {
      await this.api.prompt(model, 'hi', 1);
    });
  }

  async unload(model?: string): Promise<void> {
    await this.run(model ?? 'all', () => this.api.unload(model));
  }

  async ask(): Promise<void> {
    const text = this.promptText().trim();
    if (!text || !this.promptModel() || this.prompting()) return;
    this.prompting.set(true);
    this.promptError.set(null);
    this.answer.set(null);
    try {
      this.answer.set(await this.api.prompt(this.promptModel(), text, 512));
      void this.load();
    } catch (error) {
      this.promptError.set((error as Error).message);
    } finally {
      this.prompting.set(false);
    }
  }

  async loadLogs(): Promise<void> {
    try {
      this.logs.set((await this.api.logs()).slice(-MAX_LOG_CHARS));
    } catch (error) {
      this.logs.set((error as Error).message);
    }
  }

  followLogs(): void {
    if (this.following()) return;
    this.following.set(true);
    this.logs.set('');
    this.logAbort = new AbortController();
    this.api
      .streamLogs(
        (chunk) => this.logs.update((text) => (text + chunk).slice(-MAX_LOG_CHARS)),
        this.logAbort.signal,
      )
      .catch(() => undefined)
      .finally(() => this.following.set(false));
  }

  stopLogs(): void {
    this.logAbort?.abort();
    this.logAbort = null;
    this.following.set(false);
  }

  private async run(key: string, action: () => Promise<void>): Promise<void> {
    this.busy.set(key);
    this.error.set(null);
    try {
      await action();
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.busy.set(null);
      await this.load();
    }
  }
}
