export type StreamEventType = 'token' | 'status' | 'progress' | 'final' | 'error' | 'complete';

export interface StreamEvent {
  type: StreamEventType;
  content: string;
  sessionId?: string;
  metadata?: Record<string, unknown>;
}
