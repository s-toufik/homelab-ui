import type { ChatMessage } from './chat-message';
import { isAwaitingApproval } from './pending-plan';

export interface Conversation {
  readonly id: string;
  readonly agent: string;
  readonly title: string;
  readonly updatedAt: number;
  readonly messages: readonly ChatMessage[];
}

export const KEPT_MESSAGES = 40;
export const KEPT_CONVERSATIONS = 30;
const TITLE_LENGTH = 60;

export function titleOf(messages: readonly ChatMessage[]): string {
  const first = messages.find((message) => message.role === 'user')?.content.trim();
  if (!first) return 'New conversation';
  const line = first.split('\n')[0];
  return line.length > TITLE_LENGTH ? `${line.slice(0, TITLE_LENGTH).trimEnd()}…` : line;
}

export function isWaiting(conversation: Conversation): boolean {
  return isAwaitingApproval(conversation.messages.at(-1));
}

export function byRecent(conversations: readonly Conversation[]): Conversation[] {
  return [...conversations]
    .filter((conversation) => conversation.messages.length > 0)
    .sort((a, b) => b.updatedAt - a.updatedAt);
}

export function keepable(conversations: readonly Conversation[]): Conversation[] {
  return byRecent(conversations)
    .slice(0, KEPT_CONVERSATIONS)
    .map((conversation) => ({
      ...conversation,
      messages: conversation.messages
        .filter((message) => !message.streaming)
        .slice(-KEPT_MESSAGES)
        .map(({ status: _status, ...message }) => message),
    }));
}
