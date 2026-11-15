import { TestBed } from '@angular/core/testing';
import type { AgentRequestBody } from '../domain/agent-request';
import type { StreamEvent } from '../domain/stream-event';
import { AgentApiService } from '../infrastructure/api/agent-api.service';
import { AgentModelsService } from '../infrastructure/api/agent-models.service';
import { PREFERENCES_STORAGE } from '../infrastructure/storage/agent-preferences.storage';
import { memoryStorage } from '../infrastructure/storage/memory-storage';
import type { ModelListing } from '../domain/model-catalog';
import { AgentDirectoryService } from '../infrastructure/api/agent-directory.service';
import { AgentStore } from './agent.store';

function storeStreaming(
  events: StreamEvent[],
  seen: (store: AgentStore) => void = () => {},
  bodies: AgentRequestBody[] = [],
  agents: string[] = [],
) {
  const api = {
    async *stream(agent: string, body: AgentRequestBody): AsyncGenerator<StreamEvent> {
      agents.push(agent);
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
  let storage: Storage;

  beforeEach(() => {
    storage = memoryStorage();
    TestBed.configureTestingModule({
      providers: [{ provide: PREFERENCES_STORAGE, useValue: storage }],
    });
  });

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

  it('keeps everything the final event reports about the answer', async () => {
    const store = storeStreaming([
      {
        type: 'final',
        content: 'Done.',
        metadata: { elapsed_time: '4s', input_tokens: '1200', a_new_field: 'shown too' },
      },
      event('complete'),
    ]);
    store.draft.set('hello');

    await store.send();

    expect(store.messages().at(-1)!.metadata).toEqual({
      elapsed_time: '4s',
      input_tokens: '1200',
      a_new_field: 'shown too',
    });
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

  it('shows an error under the bubble and stops streaming', async () => {
    const store = storeStreaming([
      event('status', 'Understanding your request'),
      event('error', 'Traceback: boom'),
      event('complete'),
    ]);
    store.draft.set('hello');

    await store.send();

    const reply = store.messages().at(-1)!;
    expect(reply.error).toBe('Traceback: boom');
    expect(reply.status).toBeUndefined();
    expect(reply.streaming).toBe(false);
  });

  describe('models', () => {
    const listing: ModelListing = {
      models: [
        { name: 'first', contextTokens: 1, maxOutputTokens: 1, thinking: false },
        { name: 'second', contextTokens: 1, maxOutputTokens: 1, thinking: true },
      ],
      pinnedSteps: { act: 'second' },
    };

    function storeListing(list: () => Promise<ModelListing>): AgentStore {
      TestBed.configureTestingModule({
        providers: [{ provide: AgentModelsService, useValue: { list } }],
      });
      return TestBed.inject(AgentStore);
    }

    it('loads the models and picks the first one', async () => {
      const store = storeListing(async () => listing);

      await store.loadModels();

      expect(store.modelNames()).toEqual(['first', 'second']);
      expect(store.pinnedSteps()).toEqual({ act: 'second' });
      expect(store.modelName()).toBe('first');
    });

    it('keeps the chosen model when the agent still offers it', async () => {
      const store = storeListing(async () => listing);
      store.modelName.set('second');

      await store.loadModels();

      expect(store.modelName()).toBe('second');
    });

    it('reports a failure and cannot send without a model', async () => {
      const store = storeListing(() => Promise.reject(new Error('down')));
      store.draft.set('hello');

      await store.loadModels();

      expect(store.modelsError()).toContain("Couldn't load");
      expect(store.canSend()).toBe(false);
    });
  });

  describe('preferences', () => {
    it('restores the last model and auto-approve choice', () => {
      storage.setItem(
        'homelab-ui.agent.preferences',
        JSON.stringify({ modelName: 'second', autoApprove: true }),
      );

      const store = TestBed.inject(AgentStore);

      expect(store.modelName()).toBe('second');
      expect(store.autoApprove()).toBe(true);
    });

    it('saves a change as soon as it is made', () => {
      const store = TestBed.inject(AgentStore);

      store.modelName.set('big-model');
      store.autoApprove.set(true);
      TestBed.tick();

      expect(JSON.parse(storage.getItem('homelab-ui.agent.preferences')!)).toEqual({
        agentName: 'supervisor',
        modelName: 'big-model',
        autoApprove: true,
      });
    });
  });

  describe('agents', () => {
    const agents = [
      { name: 'supervisor', description: 'the supervisor', skills: [] },
      { name: 'observation', description: 'the observation agent', skills: [] },
    ];
    const listing: ModelListing = {
      models: [{ name: 'm', contextTokens: 1, maxOutputTokens: 1, thinking: false }],
      pinnedSteps: {},
    };

    function storeWith(list: () => Promise<typeof agents>, modelsOf: string[] = []): AgentStore {
      TestBed.configureTestingModule({
        providers: [
          { provide: AgentDirectoryService, useValue: { list } },
          {
            provide: AgentModelsService,
            useValue: {
              list: async (agent: string) => {
                modelsOf.push(agent);
                return listing;
              },
            },
          },
        ],
      });
      return TestBed.inject(AgentStore);
    }

    it('lists the agents and loads the models of the chosen one', async () => {
      const modelsOf: string[] = [];
      const store = storeWith(async () => agents, modelsOf);

      await store.loadAgents();

      expect(store.agents().map((agent) => agent.name)).toEqual(['supervisor', 'observation']);
      expect(store.agent()?.description).toBe('the supervisor');
      expect(modelsOf).toEqual(['supervisor']);
    });

    it('starts a new conversation with the agent it switches to', async () => {
      const modelsOf: string[] = [];
      const store = storeWith(async () => agents, modelsOf);
      await store.loadAgents();
      const before = store.sessionId();

      await store.chooseAgent('observation');

      expect(store.agentName()).toBe('observation');
      expect(store.sessionId()).not.toBe(before);
      expect(modelsOf).toEqual(['supervisor', 'observation']);
    });

    it('falls back to the first agent when the saved one is gone', async () => {
      storage.setItem('homelab-ui.agent.preferences', JSON.stringify({ agentName: 'kitchen' }));
      const store = storeWith(async () => agents);

      await store.loadAgents();

      expect(store.agentName()).toBe('supervisor');
    });

    it('still loads the models when the supervisor cannot list the agents', async () => {
      const modelsOf: string[] = [];
      const store = storeWith(() => Promise.reject(new Error('down')), modelsOf);

      await store.loadAgents();

      expect(store.agentsError()).toContain("Couldn't load the agents");
      expect(modelsOf).toEqual(['supervisor']);
    });

    it('sends each message to the chosen agent', async () => {
      const sentTo: string[] = [];
      const store = storeStreaming([event('complete')], () => {}, [], sentTo);
      store.agentName.set('observation');
      store.modelName.set('m');
      store.draft.set('hi');

      await store.send();

      expect(sentTo).toEqual(['observation']);
    });
  });
});
