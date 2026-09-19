import { Component, input } from '@angular/core';
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
}
