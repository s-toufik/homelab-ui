import { Component, ElementRef, effect, input, viewChild } from '@angular/core';
import type { ChatMessage } from '../../domain/chat-message';
import { Message } from '../message/message';

@Component({
  selector: 'app-conversation',
  imports: [Message],
  templateUrl: './conversation.html',
  styleUrl: './conversation.scss',
})
export class Conversation {
  readonly messages = input.required<ChatMessage[]>();
  private readonly scrollAnchor = viewChild<ElementRef<HTMLElement>>('scrollAnchor');

  constructor() {
    // Scroll to the newest content on every message-list change (new
    // message, streamed token, error, ...).
    effect(() => {
      this.messages();
      this.scrollAnchor()?.nativeElement.scrollIntoView?.({ block: 'end' });
    });
  }
}
