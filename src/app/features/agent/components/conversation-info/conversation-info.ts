import { DatePipe } from '@angular/common';
import { Component, computed, inject, output, signal } from '@angular/core';
import { copyText } from '@shared/utils/clipboard';
import { AgentStore } from '../../application/agent.store';
import { metadataEntries } from '../../domain/answer-metadata';
import { agentLook } from '../../domain/agent-looks';

@Component({
  selector: 'app-conversation-info',
  imports: [DatePipe],
  templateUrl: './conversation-info.html',
  styleUrl: './conversation-info.scss',
})
export class ConversationInfo {
  protected readonly store = inject(AgentStore);
  readonly remove = output<void>();
  protected readonly copied = signal(false);
  protected readonly look = computed(() => agentLook(this.store.agentName()));
  protected readonly description = computed(
    () => this.store.agent()?.description || this.look().greeting,
  );
  protected readonly lastAnswer = computed(() =>
    [...this.store.messages()]
      .reverse()
      .find((message) => message.role === 'assistant' && !message.streaming),
  );
  protected readonly details = computed(() =>
    metadataEntries(this.lastAnswer()?.metadata).filter(
      (entry) => !['iteration', 'max_iteration', 'resumable'].includes(entry.key),
    ),
  );
  protected readonly questions = computed(
    () => this.store.messages().filter((m) => m.role === 'user').length,
  );

  protected async copy(): Promise<void> {
    const text = this.store
      .messages()
      .map(
        (message) => `${message.role === 'user' ? 'You' : this.look().label}: ${message.content}`,
      )
      .join('\n\n');
    this.copied.set(await copyText(text));
  }
}
