import { Component, input, output, signal } from '@angular/core';
import { MarkdownPipe } from '@shared/pipes/markdown.pipe';
import type { ChatMessage } from '../../domain/chat-message';

@Component({
  selector: 'app-message',
  imports: [MarkdownPipe],
  templateUrl: './message.html',
  styleUrl: './message.scss',
})
export class Message {
  readonly message = input.required<ChatMessage>();
  readonly resend = output<string>();

  readonly copied = signal(false);
  private copiedTimeout?: ReturnType<typeof setTimeout>;

  async copy(): Promise<void> {
    await navigator.clipboard.writeText(this.message().content);
    this.copied.set(true);
    clearTimeout(this.copiedTimeout);
    this.copiedTimeout = setTimeout(() => this.copied.set(false), 1500);
  }
}
