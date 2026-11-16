import { Injectable, inject } from '@angular/core';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
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
  private readonly session = inject(GatewaySession, { optional: true });

  private key(): string {
    const username = this.session?.user()?.username;
    return username ? `${CONVERSATIONS_KEY}.${username}` : CONVERSATIONS_KEY;
  }

  private raw(): string {
    const key = this.key();
    const own = this.storage?.getItem(key);
    if (own !== null && own !== undefined) return own;
    const shared = key === CONVERSATIONS_KEY ? null : this.storage?.getItem(CONVERSATIONS_KEY);
    if (shared) {
      this.storage?.setItem(key, shared);
      this.storage?.removeItem(CONVERSATIONS_KEY);
    }
    return shared ?? '[]';
  }

  read(): Conversation[] {
    try {
      const saved: unknown = JSON.parse(this.raw());
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
      this.storage?.setItem(this.key(), JSON.stringify(keepable(conversations)));
    } catch {
      return;
    }
  }
}
