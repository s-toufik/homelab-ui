import { TestBed } from '@angular/core/testing';
import type { AgentRequestBody } from '../domain/agent-request';
import type { StreamEvent } from '../domain/stream-event';
import { AgentApiService } from '../infrastructure/api/agent-api.service';
import { AgentStore } from './agent.store';

function storeStreaming(
  events: StreamEvent[],
  seen: (store: AgentStore) => void = () => {},
  bodies: AgentRequestBody[] = [],
) {
  const api = {
    async *stream(body: AgentRequestBody): AsyncGenerator<StreamEvent> {
      bodies.push(body);
      for (const event of events) {
        yield event;
        seen(store);
      }
    },
  };
  TestBed.configureTestingModule({ providers: [{ provide: AgentApiService, useValue: api }] });
  const store = TestBed.inject(AgentStore);
  return store;
}

const event = (type: StreamEvent['type'], content = ''): StreamEvent => ({ type, content });

describe('AgentStore', () => {
  it('shows each status while streaming and clears it once the reply settles', async () => {
    const statuses: (string | undefined)[] = [];
    const store = storeStreaming(
      [
        event('status', 'Understanding your request'),
        event('status', 'Running file_reader'),
        event('token', 'There are '),
        event('token', '42 rows.'),
        event('final', 'There are 42 rows.'),
        event('complete'),
      ],
      (current) => statuses.push(current.messages().at(-1)?.status),
    );
    store.draft.set('count the rows');

    await store.send();

    expect(statuses.slice(0, 2)).toEqual(['Understanding your request', 'Running file_reader']);
    const reply = store.messages().at(-1)!;
    expect(reply).toMatchObject({ content: 'There are 42 rows.', streaming: false });
    expect(reply.status).toBeUndefined();
  });

  it('replaces the bubble with the final content', async () => {
    const store = storeStreaming([
      event('token', 'draft'),
      event('final', 'The accepted answer.'),
      event('complete'),
    ]);
    store.draft.set('hello');

    await store.send();

    expect(store.messages().at(-1)!.content).toBe('The accepted answer.');
  });

  it('sends the auto-approve choice with each message', async () => {
    const bodies: AgentRequestBody[] = [];
    const store = storeStreaming([event('complete')], () => {}, bodies);

    store.draft.set('first');
    await store.send();
    store.autoApprove.set(true);
    store.draft.set('second');
    await store.send();

    expect(bodies.map((body) => body.auto_approve)).toEqual([false, true]);
  });
});
