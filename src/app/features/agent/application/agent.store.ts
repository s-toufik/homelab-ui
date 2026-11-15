import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type { SwarmPhase } from '@shared/ui/swarm-avatar/swarm-avatar';
import { newId } from '@shared/utils/uuid';
import { answerMetadata } from '../domain/answer-metadata';
import type { ChatMessage } from '../domain/chat-message';
import type { AgentProfile } from '../domain/agent-directory';
import { NO_MODELS, type ModelListing } from '../domain/model-catalog';
import type { StreamEvent } from '../domain/stream-event';
import { AgentApiService } from '../infrastructure/api/agent-api.service';
import { AgentDirectoryService } from '../infrastructure/api/agent-directory.service';
import { AgentModelsService } from '../infrastructure/api/agent-models.service';
import { AgentPreferencesStorage } from '../infrastructure/storage/agent-preferences.storage';

@Injectable({ providedIn: 'root' })
export class AgentStore {
  private readonly api = inject(AgentApiService);
  private readonly modelCatalog = inject(AgentModelsService);
  private readonly directory = inject(AgentDirectoryService);
  private readonly preferences = inject(AgentPreferencesStorage);
  private readonly saved = this.preferences.read();

  readonly agents = signal<AgentProfile[]>([]);
  readonly agentsError = signal<string | null>(null);
  readonly agentName = signal(this.saved.agentName);
  readonly agent = computed(() => this.agents().find((agent) => agent.name === this.agentName()));
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

  readonly phase = computed<SwarmPhase>(() => {
    const last = [...this.messages()].reverse().find((message) => message.role === 'assistant');
    if (!this.isStreaming()) return last?.error ? 'error' : 'idle';
    if (last?.content) return 'final';
    if (last?.status && /execut|running|tool/i.test(last.status)) return 'executor';
    return 'thinking';
  });

  private abortController: AbortController | null = null;

  constructor() {
    effect(() => {
      this.preferences.write({
        agentName: this.agentName(),
        modelName: this.modelName(),
        autoApprove: this.autoApprove(),
      });
    });
  }

  async loadAgents(): Promise<void> {
    try {
      const agents = await this.directory.list();
      this.agents.set(agents);
      this.agentsError.set(null);
      if (!agents.some((agent) => agent.name === this.agentName())) {
        this.agentName.set(agents[0]?.name ?? this.agentName());
      }
    } catch {
      this.agentsError.set("Couldn't load the agents from the orchestrator.");
    }
    await this.loadModels();
  }

  async chooseAgent(name: string): Promise<void> {
    if (name === this.agentName()) return;
    this.agentName.set(name);
    this.newSession();
    await this.loadModels();
  }

  async loadModels(): Promise<void> {
    try {
      const listing = await this.modelCatalog.list(this.agentName());
      this.modelListing.set(listing);
      this.modelsError.set(null);
      const names = listing.models.map((model) => model.name);
      if (!names.includes(this.modelName())) {
        this.modelName.set(names[0] ?? '');
      }
    } catch {
      this.modelListing.set(NO_MODELS);
      this.modelsError.set(`Couldn't load the models from the ${this.agentName()} agent.`);
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
        this.agentName(),
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
            this.setAssistantMetadata(assistantId, event.metadata);
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

  private setAssistantMetadata(id: string, raw: StreamEvent['metadata']): void {
    this.updateMessage(id, (message) => ({ ...message, metadata: answerMetadata(raw) }));
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
