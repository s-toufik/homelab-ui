import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, output, signal } from '@angular/core';
import { MarkdownPipe } from '@shared/pipes/markdown.pipe';
import { copyText } from '@shared/utils/clipboard';
import { metadataEntries, usageSummary } from '../../domain/answer-metadata';
import type { ChatMessage } from '../../domain/chat-message';

@Component({
  selector: 'app-message',
  imports: [MarkdownPipe, NgTemplateOutlet],
  templateUrl: './message.html',
  styleUrl: './message.scss',
})
export class Message {
  readonly message = input.required<ChatMessage>();
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
