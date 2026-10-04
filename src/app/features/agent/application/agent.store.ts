import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type { ChatMessage } from '../domain/chat-message';
import { NO_MODELS, type ModelListing } from '../domain/model-catalog';
import { AgentApiService } from '../infrastructure/api/agent-api.service';
import { AgentModelsService } from '../infrastructure/api/agent-models.service';
import { AgentPreferencesStorage } from '../infrastructure/storage/agent-preferences.storage';

function newId(): string {
  if (typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

@Injectable({ providedIn: 'root' })
export class AgentStore {
  private readonly api = inject(AgentApiService);
  private readonly modelCatalog = inject(AgentModelsService);
  private readonly preferences = inject(AgentPreferencesStorage);
  private readonly saved = this.preferences.read();

  readonly modelListing = signal<ModelListing>(NO_MODELS);
  readonly modelsError = signal<string | null>(null);
  readonly modelNames = computed(() => this.modelListing().models.map((model) => model.name));
  readonly pinnedSteps = computed(() => this.modelListing().pinnedSteps);
  readonly modelName = signal(this.saved.modelName);
  readonly sessionId = signal(newId());
  readonly autoApprove = signal(this.saved.autoApprove);
  readonly draft = signal('');
  readonly messages = signal<ChatMessage[]>([]);
  readonly isStreaming = signal(false);
  readonly requestError = signal<string | null>(null);
  readonly canSend = computed(
    () => this.draft().trim().length > 0 && !this.isStreaming() && this.modelName() !== '',
  );

  private abortController: AbortController | null = null;

  constructor() {
    effect(() => {
      this.preferences.write({ modelName: this.modelName(), autoApprove: this.autoApprove() });
    });
  }

  async loadModels(): Promise<void> {
    try {
      const listing = await this.modelCatalog.list();
      this.modelListing.set(listing);
      this.modelsError.set(null);
      const names = listing.models.map((model) => model.name);
      if (!names.includes(this.modelName())) {
        this.modelName.set(names[0] ?? '');
      }
    } catch {
      this.modelsError.set("Couldn't load the models from the agent.");
    }
  }

  newSession(): void {
    this.abortController?.abort();
    this.sessionId.set(newId());
    this.messages.set([]);
    this.requestError.set(null);
  }

  async send(): Promise<void> {
    const text = this.draft().trim();
    if (!text || this.isStreaming()) return;

    this.draft.set('');
    await this.dispatch(text);
  }

  async resend(text: string): Promise<void> {
    const trimmed = text.trim();
    if (!trimmed || this.isStreaming()) return;

    await this.dispatch(trimmed);
  }

  cancel(): void {
    this.abortController?.abort();
  }

  private async dispatch(text: string): Promise<void> {
    this.requestError.set(null);
    this.messages.update((current) => [
      ...current,
      { id: newId(), role: 'user', content: text, streaming: false },
    ]);

    const assistantId = newId();
    this.messages.update((current) => [
      ...current,
      { id: assistantId, role: 'assistant', content: '', streaming: true },
    ]);

    this.abortController = new AbortController();
    this.isStreaming.set(true);

    try {
      const events = this.api.stream(
        {
          message: text,
          model_name: this.modelName(),
          request_id: this.sessionId(),
          auto_approve: this.autoApprove(),
        },
        this.abortController.signal,
      );

      for await (const event of events) {
        switch (event.type) {
          case 'token':
            this.appendToAssistant(assistantId, event.content);
            break;
          case 'status':
            this.setAssistantStatus(assistantId, event.content);
            break;
          case 'final':
            this.setAssistantContent(assistantId, event.content);
            this.setAssistantStatus(assistantId, undefined);
            break;
          case 'error':
            this.setAssistantError(assistantId, event.content);
            break;
          case 'complete':
            this.setAssistantStreaming(assistantId, false);
            break;
        }
      }
    } catch (error) {
      if ((error as Error).name !== 'AbortError') {
        this.requestError.set((error as Error).message);
      }
      this.setAssistantStreaming(assistantId, false);
    } finally {
      this.isStreaming.set(false);
      this.abortController = null;
    }
  }

  private appendToAssistant(id: string, chunk: string): void {
    this.updateMessage(id, (message) => ({ ...message, content: message.content + chunk }));
  }

  private setAssistantContent(id: string, content: string): void {
    this.updateMessage(id, (message) => ({ ...message, content }));
  }

  private setAssistantStatus(id: string, status: string | undefined): void {
    this.updateMessage(id, (message) => ({ ...message, status }));
  }

  private setAssistantError(id: string, error: string): void {
    this.updateMessage(id, (message) => ({
      ...message,
      error,
      status: undefined,
      streaming: false,
    }));
  }

  private setAssistantStreaming(id: string, streaming: boolean): void {
    this.updateMessage(id, (message) => ({
      ...message,
      streaming,
      status: streaming ? message.status : undefined,
    }));
  }

  private updateMessage(id: string, updater: (message: ChatMessage) => ChatMessage): void {
    this.messages.update((current) => current.map((m) => (m.id === id ? updater(m) : m)));
  }
}
