import { Injectable, inject } from '@angular/core';
import { GatewayApi } from '@shared/infrastructure/gateway-api';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import type { LlmModel, ModelState, PromptAnswer } from '../../domain/model';
import LLM from '../llm.json';

interface ModelsResponse {
  data?: { id: string; name?: string; description?: string }[];
}

interface RunningResponse {
  running?: { model: string; state?: string }[];
}

interface CompletionResponse {
  choices?: { message?: { content?: string; reasoning_content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export function toModels(models: ModelsResponse, running: RunningResponse): LlmModel[] {
  const states = new Map(
    (running.running ?? []).map((entry) => [entry.model, entry.state ?? 'ready']),
  );
  return (models.data ?? [])
    .map((model) => {
      const state = states.get(model.id);
      return {
        id: model.id,
        name: model.name ?? model.id,
        description: model.description ?? '',
        state: (state
          ? ['ready', 'starting', 'stopping'].includes(state)
            ? state
            : 'ready'
          : 'stopped') as ModelState,
      };
    })
    .sort(
      (a, b) =>
        Number(b.state !== 'stopped') - Number(a.state !== 'stopped') || a.id.localeCompare(b.id),
    );
}

@Injectable({ providedIn: 'root' })
export class LlmApiService {
  private readonly api = inject(GatewayApi);
  private readonly server = inject(HomelabServer);

  url(path: string): string {
    return this.server.api(LLM, path);
  }

  async models(): Promise<LlmModel[]> {
    const [models, running] = await Promise.all([
      this.api.json<ModelsResponse>(this.url('/v1/models')),
      this.api.json<RunningResponse>(this.url('/running')).catch(() => ({ running: [] })),
    ]);
    return toModels(models, running);
  }

  async prompt(model: string, text: string, maxTokens: number): Promise<PromptAnswer> {
    const started = performance.now();
    const body = await this.api.json<CompletionResponse>(this.url('/v1/chat/completions'), {
      method: 'POST',
      body: {
        model,
        messages: [{ role: 'user', content: text }],
        max_tokens: maxTokens,
        stream: false,
      },
      timeoutMs: 3_600_000,
    });
    const message = body.choices?.[0]?.message;
    return {
      text: message?.content || message?.reasoning_content || '',
      promptTokens: body.usage?.prompt_tokens ?? 0,
      completionTokens: body.usage?.completion_tokens ?? 0,
      seconds: (performance.now() - started) / 1000,
    };
  }

  async unload(model?: string): Promise<void> {
    const path = model ? `/api/models/unload/${encodeURIComponent(model)}` : '/api/models/unload';
    await this.api.send(this.url(path), { method: 'POST' });
  }

  async logs(): Promise<string> {
    return this.api.text(this.url('/logs'), { accept: 'text/plain' });
  }

  async streamLogs(onChunk: (text: string) => void, signal: AbortSignal): Promise<void> {
    const response = await this.api.send(this.url('/logs/stream'), {
      accept: 'text/plain',
      signal,
      timeoutMs: 24 * 3600_000,
    });
    const reader = response.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      onChunk(decoder.decode(value, { stream: true }));
    }
  }
}
