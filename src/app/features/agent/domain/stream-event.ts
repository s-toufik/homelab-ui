export type StreamEventType = 'token' | 'status' | 'final' | 'error' | 'complete';

export interface StreamEvent {
  type: StreamEventType;
  content: string;
  sessionId?: string;
  metadata?: Record<string, string | number>;
}
