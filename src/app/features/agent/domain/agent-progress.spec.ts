import {
  applyProgress,
  emptyProgress,
  hasProgress,
  parseProgress,
  settle,
  stepCount,
  visibleTools,
  type ProgressEvent,
} from './agent-progress';

function run(...events: ProgressEvent[]) {
  return events.reduce(applyProgress, emptyProgress());
}

describe('agent progress', () => {
  it('builds the supervisor asking observation, with observation’s plan and tools nested', () => {
    const tree = run(
      { kind: 'tool', path: [], callId: 'd1', name: 'delegate_tasks', state: 'running' },
      {
        kind: 'agent',
        path: [],
        name: 'observation',
        state: 'working',
        detail: 'Show caddy logs',
      },
      {
        kind: 'plan',
        path: ['observation'],
        steps: [
          { number: 1, action: 'Find the pod', tool: 'kubectl_get', state: 'done' },
          { number: 2, action: 'Read the logs', tool: 'loki_query', state: 'current' },
          { number: 3, action: 'Sum up', tool: null, state: 'todo' },
        ],
      },
      {
        kind: 'tool',
        path: ['observation'],
        callId: 'c1',
        name: 'loki_query',
        state: 'running',
        detail: '{"query":"caddy"}',
      },
      { kind: 'tool', path: ['observation'], callId: 'c1', name: 'loki_query', state: 'done' },
    );

    const [observation] = tree.agents;
    expect(observation).toMatchObject({
      agent: 'observation',
      state: 'working',
      task: 'Show caddy logs',
    });
    expect(stepCount(observation)).toEqual({ done: 1, total: 3 });
    expect(observation.tools).toEqual([
      { callId: 'c1', name: 'loki_query', state: 'done', detail: '{"query":"caddy"}' },
    ]);
    expect(visibleTools(tree)).toEqual([]);
    expect(hasProgress(tree)).toBe(true);
  });

  it('keeps agents working at the same time side by side, and marks how each ended', () => {
    const tree = run(
      { kind: 'agent', path: [], name: 'kitchen', state: 'working', detail: 'dinner' },
      { kind: 'agent', path: [], name: 'travel', state: 'working', detail: 'trip' },
      { kind: 'agent', path: [], name: 'travel', state: 'failed' },
      { kind: 'agent', path: [], name: 'kitchen', state: 'answered' },
    );

    expect(tree.agents.map((a) => [a.agent, a.state, a.task])).toEqual([
      ['kitchen', 'answered', 'dinner'],
      ['travel', 'failed', 'trip'],
    ]);
  });

  it('places deeper delegations under each agent', () => {
    const tree = run({ kind: 'agent', path: ['analysis'], name: 'coding', state: 'working' });

    expect(tree.agents[0].agent).toBe('analysis');
    expect(tree.agents[0].agents[0]).toMatchObject({ agent: 'coding', state: 'working' });
  });

  it('settles what was still running when the answer arrives', () => {
    const tree = settle(
      run(
        { kind: 'agent', path: [], name: 'kitchen', state: 'working' },
        { kind: 'tool', path: ['kitchen'], callId: 'c1', name: 'recipes', state: 'running' },
      ),
    );

    expect(tree.agents[0].state).toBe('answered');
    expect(tree.agents[0].tools[0].state).toBe('done');
  });

  it('finishes the current step when the answer arrives', () => {
    const tree = settle(
      run({
        kind: 'plan',
        path: [],
        steps: [
          { number: 1, action: 'Ask', tool: 'delegate_tasks', state: 'current' },
          { number: 2, action: 'Combine', tool: null, state: 'todo' },
        ],
      }),
    );

    expect(tree.steps.map((step) => step.state)).toEqual(['done', 'todo']);
    expect(tree.state).toBeNull();
  });

  it('marks what was cut short as stopped when the request is cancelled', () => {
    const tree = settle(
      run(
        {
          kind: 'plan',
          path: [],
          steps: [
            { number: 1, action: 'Ask', tool: 'delegate_tasks', state: 'current' },
            { number: 2, action: 'Combine', tool: null, state: 'todo' },
          ],
        },
        { kind: 'agent', path: [], name: 'kitchen', state: 'working' },
        { kind: 'agent', path: [], name: 'travel', state: 'working' },
        { kind: 'agent', path: [], name: 'travel', state: 'answered' },
        { kind: 'tool', path: ['kitchen'], callId: 'c1', name: 'recipes', state: 'running' },
      ),
      'stopped',
    );

    expect(tree.state).toBe('stopped');
    expect(tree.steps.map((step) => step.state)).toEqual(['stopped', 'todo']);
    expect(tree.agents.map((a) => [a.agent, a.state])).toEqual([
      ['kitchen', 'stopped'],
      ['travel', 'answered'],
    ]);
    expect(tree.agents[0].tools[0].state).toBe('stopped');
  });

  it('reads progress frames and ignores anything else', () => {
    expect(parseProgress('{"kind":"plan","path":["observation"],"steps":[]}')).toMatchObject({
      kind: 'plan',
      path: ['observation'],
    });
    expect(parseProgress('{"kind":"weather"}')).toBeNull();
    expect(parseProgress('not json')).toBeNull();
    expect(hasProgress(emptyProgress())).toBe(false);
  });
});
