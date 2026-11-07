import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { MarkdownPipe } from '@shared/pipes/markdown.pipe';
import { type SwarmPhase, SwarmAvatar } from '@shared/ui/swarm-avatar/swarm-avatar';
import { copyText } from '@shared/utils/clipboard';
import { metadataEntries, usageSummary } from '../../domain/answer-metadata';
import type { ChatMessage } from '../../domain/chat-message';

@Component({
  selector: 'app-message',
  imports: [MarkdownPipe, NgTemplateOutlet, SwarmAvatar],
  templateUrl: './message.html',
  styleUrl: './message.scss',
})
export class Message {
  readonly message = input.required<ChatMessage>();
  protected readonly phase = computed<SwarmPhase>(() => {
    const status = this.message().status ?? '';
    return /execut|running|tool/i.test(status) ? 'executor' : 'thinking';
  });
  readonly resend = output<string>();

  readonly copied = signal(false);
  readonly detailsOpen = signal(false);
  readonly usage = computed(() => usageSummary(this.message().metadata));
  readonly details = computed(() => metadataEntries(this.message().metadata));
  readonly settled = computed(() => {
    const message = this.message();
    return message.role === 'assistant' && !message.streaming && message.content !== '';
  });
  private copiedTimeout?: ReturnType<typeof setTimeout>;

  async copy(): Promise<void> {
    const copied = await copyText(this.message().content);
    if (!copied) return;
    this.copied.set(true);
    clearTimeout(this.copiedTimeout);
    this.copiedTimeout = setTimeout(() => this.copied.set(false), 1500);
  }

  toggleDetails(): void {
    this.detailsOpen.update((open) => !open);
  }
}
