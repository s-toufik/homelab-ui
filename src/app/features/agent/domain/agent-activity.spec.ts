import { activeByAgent, delegations, moodOf, phraseOf } from './agent-activity';

describe('agent activity', () => {
  it('works while this browser streams or the server is busy, then waits, then rests', () => {
    const base = { localPhase: null, serverActive: 0, waitingPlans: 0 };
    expect(moodOf(base)).toBe('idle');
    expect(moodOf({ ...base, localPhase: 'thinking' })).toBe('working');
    expect(moodOf({ ...base, serverActive: 1, waitingPlans: 2 })).toBe('working');
    expect(moodOf({ ...base, waitingPlans: 1 })).toBe('waiting');
    expect(moodOf({ ...base, localPhase: 'error', serverActive: 3 })).toBe('trouble');
  });

  it('reads busy agents from the OpenTelemetry service name', () => {
    expect(
      activeByAgent([
        { labels: { job: 'agent-kitchen' }, value: 1 },
        { labels: { job: 'homelab/agent-kitchen' }, value: 1 },
        { labels: { service_name: 'agent-travel' }, value: 0 },
        { labels: { job: 'caddy' }, value: 4 },
      ]),
    ).toEqual({ kitchen: 2, travel: 0 });
  });

  it('describes each agent in its own words', () => {
    expect(phraseOf('kitchen', 'working')).toBe('Cooking up an answer');
    expect(phraseOf('unknown', 'idle')).toBe('Resting');
  });

  it('links the supervisor to the agents working while it works', () => {
    expect(delegations({ supervisor: 'working', kitchen: 'working', travel: 'idle' })).toEqual([
      'kitchen',
    ]);
    expect(delegations({ supervisor: 'idle', kitchen: 'working' })).toEqual([]);
  });
});
