import { Component, ElementRef, afterRenderEffect, input, output, viewChild } from '@angular/core';
import type { ChatMessage } from '../../domain/chat-message';
import { Message } from '../message/message';

const NEAR_BOTTOM_PX = 80;

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

  private stickToBottom = true;
  private previousCount = 0;

  constructor() {
    afterRenderEffect(() => {
      const messages = this.messages();
      if (messages.length !== this.previousCount) {
        this.previousCount = messages.length;
        this.stickToBottom = true;
      }
      if (this.stickToBottom) {
        this.scrollAnchor()?.nativeElement.scrollIntoView?.({ block: 'end' });
      }
    });
  }

  onScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const distanceFromBottom = element.scrollHeight - element.scrollTop - element.clientHeight;
    this.stickToBottom = distanceFromBottom < NEAR_BOTTOM_PX;
  }
}
