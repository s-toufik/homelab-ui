import { Component, ElementRef, effect, input, output, viewChild } from '@angular/core';
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
  readonly resend = output<string>();
  private readonly scrollAnchor = viewChild<ElementRef<HTMLElement>>('scrollAnchor');

  constructor() {
    effect(() => {
      this.messages();
      this.scrollAnchor()?.nativeElement.scrollIntoView?.({ block: 'end' });
    });
  }
}
