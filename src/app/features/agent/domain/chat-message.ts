import type { AnswerMetadata } from './answer-metadata';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: ChatRole;
  content: string;
  streaming: boolean;
  status?: string;
  error?: string;
  metadata?: AnswerMetadata;
}
