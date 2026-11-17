import { applyProgress, emptyProgress, parseProgress, settle } from '../domain/agent-progress';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type { SwarmPhase } from '@shared/ui/swarm-avatar/swarm-avatar';
import { newId } from '@shared/utils/uuid';
import { byRecent, isWaiting, titleOf, type Conversation } from '../domain/agent-conversation';
import { answerMetadata } from '../domain/answer-metadata';
import type { ChatMessage } from '../domain/chat-message';
import type { AgentProfile } from '../domain/agent-directory';
import { NO_MODELS, type ModelListing } from '../domain/model-catalog';
import {
  APPROVE_REPLY,
  AWAITING_APPROVAL,
  DROP_REPLY,
  pendingPlan,
  withoutApprovalPrompt,
} from '../domain/pending-plan';
import type { StreamEvent } from '../domain/stream-event';
import { AgentApiService } from '../infrastructure/api/agent-api.service';
import { AgentDirectoryService } from '../infrastructure/api/agent-directory.service';
import { AgentModelsService } from '../infrastructure/api/agent-models.service';
import { AgentPreferencesStorage } from '../infrastructure/storage/agent-preferences.storage';
import { ConversationStorage } from '../infrastructure/storage/conversation.storage';

@Injectable({ providedIn: 'root' })
export class AgentStore {
  private readonly api = inject(AgentApiService);
  private readonly modelCatalog = inject(AgentModelsService);
  private readonly directoryService = inject(AgentDirectoryService);
  private readonly preferences = inject(AgentPreferencesStorage);
  private readonly conversationStorage = inject(ConversationStorage);
  private readonly saved = this.preferences.read();
  private readonly all = signal<Conversation[]>(this.conversationStorage.read());
  private readonly latest = byRecent(this.all())[0];

  readonly agents = signal<AgentProfile[]>([]);
  readonly agentsError = signal<string | null>(null);
  readonly agentName = signal(this.latest?.agent ?? this.saved.agentName);
  readonly agent = computed(() => this.agents().find((agent) => agent.name === this.agentName()));
  readonly modelListing = signal<ModelListing>(NO_MODELS);
  readonly modelsError = signal<string | null>(null);
  readonly modelNames = computed(() => this.modelListing().models.map((model) => model.name));
  readonly pinnedSteps = computed(() => this.modelListing().pinnedSteps);
  readonly modelName = signal(this.saved.modelName);
  readonly sessionId = signal(this.latest?.id ?? newId());
  readonly autoApprove = signal(this.saved.autoApprove);
  readonly draft = signal('');
  readonly isStreaming = signal(false);
  readonly requestError = signal<string | null>(null);

  readonly conversation = computed(() => this.all().find((c) => c.id === this.sessionId()) ?? null);
  readonly messages = computed<readonly ChatMessage[]>(() => this.conversation()?.messages ?? []);
  readonly conversations = computed(() => byRecent(this.all()));
  readonly waiting = computed(() => this.conversations().filter(isWaiting));
  readonly plan = computed(() => (this.isStreaming() ? null : pendingPlan(this.messages())));
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
  private directory: Promise<void> | null = null;

  constructor() {
    effect(() => {
      this.preferences.write({
        agentName: this.agentName(),
        modelName: this.modelName(),
        autoApprove: this.autoApprove(),
      });
    });

    effect(() => {
      if (this.isStreaming()) return;
      this.conversationStorage.write(this.all());
    });
  }

  loadDirectory(): Promise<void> {
    this.directory ??= this.directoryService.list().then(
      (agents) => {
        this.agents.set(agents);
        this.agentsError.set(null);
      },
      () => {
        this.directory = null;
        this.agentsError.set("Couldn't load the agents from the supervisor.");
      },
    );
    return this.directory;
  }

  async loadAgents(): Promise<void> {
    this.directory = null;
    await this.loadDirectory();
    const agents = this.agents();
    if (agents.length && !agents.some((agent) => agent.name === this.agentName())) {
      this.newConversation(agents[0].name);
    }
    await this.loadModels();
  }

  async chooseAgent(name: string): Promise<void> {
    if (name === this.agentName() && this.messages().length === 0) return;
    this.newConversation(name);
    await this.loadModels();
  }

  async openConversation(id: string): Promise<void> {
    const conversation = this.all().find((c) => c.id === id);
    if (!conversation) return;
    this.abortController?.abort();
    this.sessionId.set(conversation.id);
    this.requestError.set(null);
    if (conversation.agent !== this.agentName()) {
      this.agentName.set(conversation.agent);
      await this.loadModels();
    }
  }

  async openAgent(name: string): Promise<void> {
    const latest = this.conversations().find((c) => c.agent === name);
    if (latest) await this.openConversation(latest.id);
    else {
      this.newConversation(name);
      await this.loadModels();
    }
  }

  newConversation(agent = this.agentName()): void {
    this.abortController?.abort();
    this.agentName.set(agent);
    this.sessionId.set(newId());
    this.requestError.set(null);
  }

  newSession(): void {
    this.newConversation();
  }

  deleteConversation(id: string): void {
    if (id === this.sessionId()) this.newConversation();
    this.all.update((all) => all.filter((conversation) => conversation.id !== id));
  }

  deleteAll(agents?: (agent: string) => boolean): void {
    this.newConversation();
    this.all.update((all) =>
      agents ? all.filter((conversation) => !agents(conversation.agent)) : [],
    );
  }

  async ask(agent: string, text: string): Promise<void> {
    this.newConversation(agent);
    await this.loadModels();
    await this.resend(text);
  }

  async approve(): Promise<void> {
    await this.resend(APPROVE_REPLY);
  }

  async dropPlan(): Promise<void> {
    await this.resend(DROP_REPLY);
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
    const id = this.sessionId();
    const agent = this.agentName();
    this.addMessages(id, agent, [{ id: newId(), role: 'user', content: text, streaming: false }]);

    const assistantId = newId();
    this.addMessages(id, agent, [
      { id: assistantId, role: 'assistant', content: '', streaming: true },
    ]);

    this.abortController = new AbortController();
    this.isStreaming.set(true);

    try {
      const events = this.api.stream(
        agent,
        {
          message: text,
          model_name: this.modelName(),
          request_id: id,
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
          case 'progress':
            this.addAssistantProgress(assistantId, event.content);
            break;
          case 'final':
            this.setAssistantContent(
              assistantId,
              event.metadata?.['outcome'] === AWAITING_APPROVAL
                ? withoutApprovalPrompt(event.content)
                : event.content,
            );
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

  private addMessages(id: string, agent: string, added: ChatMessage[]): void {
    this.all.update((all) => {
      const existing = all.find((c) => c.id === id);
      const messages = [...(existing?.messages ?? []), ...added];
      const next: Conversation = {
        id,
        agent: existing?.agent ?? agent,
        title: existing && existing.messages.length ? existing.title : titleOf(messages),
        updatedAt: Date.now(),
        messages,
      };
      return existing ? all.map((c) => (c.id === id ? next : c)) : [...all, next];
    });
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
      progress: !streaming && message.progress ? settle(message.progress) : message.progress,
    }));
  }

  private addAssistantProgress(id: string, content: string): void {
    const event = parseProgress(content);
    if (!event) return;
    this.updateMessage(id, (message) => ({
      ...message,
      progress: applyProgress(message.progress ?? emptyProgress(), event),
    }));
  }

  private updateMessage(id: string, updater: (message: ChatMessage) => ChatMessage): void {
    this.all.update((all) =>
      all.map((conversation) =>
        conversation.messages.some((m) => m.id === id)
          ? {
              ...conversation,
              updatedAt: Date.now(),
              messages: conversation.messages.map((m) => (m.id === id ? updater(m) : m)),
            }
          : conversation,
      ),
    );
  }
}
