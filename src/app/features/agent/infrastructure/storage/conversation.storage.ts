import { Injectable, inject } from '@angular/core';
import { keepable, titleOf, type Conversation } from '../../domain/agent-conversation';
import type { ChatMessage } from '../../domain/chat-message';
import { PREFERENCES_STORAGE } from './agent-preferences.storage';

export const CONVERSATIONS_KEY = 'homelab-ui.agent.conversations';

function isMessage(value: unknown): value is ChatMessage {
  const message = value as ChatMessage;
  return (
    !!message &&
    typeof message.id === 'string' &&
    (message.role === 'user' || message.role === 'assistant') &&
    typeof message.content === 'string'
  );
}

function messagesOf(value: unknown): ChatMessage[] {
  return Array.isArray(value)
    ? value.filter(isMessage).map((message) => ({ ...message, streaming: false }))
    : [];
}

@Injectable({ providedIn: 'root' })
export class ConversationStorage {
  private readonly storage = inject(PREFERENCES_STORAGE);

  read(): Conversation[] {
    try {
      const saved: unknown = JSON.parse(this.storage?.getItem(CONVERSATIONS_KEY) ?? '[]');
      if (Array.isArray(saved)) {
        return saved
          .filter((entry) => typeof entry?.id === 'string' && typeof entry?.agent === 'string')
          .map((entry) => {
            const messages = messagesOf(entry.messages);
            return {
              id: entry.id,
              agent: entry.agent,
              title: typeof entry.title === 'string' ? entry.title : titleOf(messages),
              updatedAt: typeof entry.updatedAt === 'number' ? entry.updatedAt : 0,
              messages,
            };
          });
      }
      return Object.entries(
        (saved ?? {}) as Record<string, { sessionId?: unknown; messages?: unknown }>,
      )
        .filter(([, value]) => typeof value?.sessionId === 'string')
        .map(([agent, value]) => {
          const messages = messagesOf(value.messages);
          return {
            id: value.sessionId as string,
            agent,
            title: titleOf(messages),
            updatedAt: 0,
            messages,
          };
        });
    } catch {
      return [];
    }
  }

  write(conversations: readonly Conversation[]): void {
    try {
      this.storage?.setItem(CONVERSATIONS_KEY, JSON.stringify(keepable(conversations)));
    } catch {
      return;
    }
  }
}
