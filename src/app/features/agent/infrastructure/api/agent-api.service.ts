import { Injectable, inject } from '@angular/core';
import type { AgentRequestBody } from '../../domain/agent-request';
import type { StreamEvent, StreamEventType } from '../../domain/stream-event';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import AGENT from '../agent.json';

@Injectable({ providedIn: 'root' })
export class AgentApiService {
  private readonly server = inject(HomelabServer);

  async *stream(body: AgentRequestBody, signal: AbortSignal): AsyncGenerator<StreamEvent> {
    const response = await fetch(this.server.url(AGENT, '/v1/stream'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok || !response.body) {
      throw new Error(`Agent request failed (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf('\n\n');
      while (boundary !== -1) {
        const frame = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);

        const event = parseFrame(frame);
        if (event) yield event;

        boundary = buffer.indexOf('\n\n');
      }
    }
  }
}

function parseFrame(frame: string): StreamEvent | null {
  let eventType = '';
  let dataLine = '';

  for (const line of frame.split('\n')) {
    if (line.startsWith('event:')) {
      eventType = line.slice('event:'.length).trim();
    } else if (line.startsWith('data:')) {
      dataLine += line.slice('data:'.length).trim();
    }
  }

  if (!dataLine) return null;

  const payload = JSON.parse(dataLine);
  return {
    type: (eventType || payload.message_status) as StreamEventType,
    content: payload.content ?? '',
    sessionId: payload.session_id,
    metadata: payload.metadata,
  };
}
