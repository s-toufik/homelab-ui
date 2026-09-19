/** Mirrors MessageStreamType on the backend. */
export type StreamEventType = 'token' | 'complete' | 'error' | 'final';

/** One parsed SSE frame, normalized from either AgentMessageStreamSchema
 * (token/complete/error) or AgentMessageSchema (final). */
export interface StreamEvent {
  type: StreamEventType;
  content: string;
  sessionId?: string;
  metadata?: Record<string, string | number>;
}
