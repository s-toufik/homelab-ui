import {
  activeByAgent,
  delegationsFrom,
  delegationsInProgress,
  moodOf,
  phraseOf,
} from './agent-activity';
import { applyProgress, emptyProgress } from './agent-progress';

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

  it('reads which agent hands a task to which from the delegations metric', () => {
    expect(
      delegationsFrom([
        { labels: { job: 'agent-supervisor', peer: 'observation' }, value: 1 },
        { labels: { job: 'homelab/agent-supervisor', peer: 'observation' }, value: 1 },
        { labels: { job: 'agent-supervisor', peer: 'security' }, value: 0 },
        { labels: { job: 'agent-analysis', peer: 'coding' }, value: 2 },
        { labels: { job: 'caddy' }, value: 1 },
      ]),
    ).toEqual([
      { from: 'supervisor', to: 'observation' },
      { from: 'analysis', to: 'coding' },
    ]);
  });

  it('reads which agents this browser’s answer is waiting on', () => {
    const progress = [
      { kind: 'agent' as const, path: [], name: 'observation', state: 'working' },
      { kind: 'agent' as const, path: [], name: 'security', state: 'answered' },
    ].reduce(applyProgress, emptyProgress());

    expect(delegationsInProgress('supervisor', progress)).toEqual([
      { from: 'supervisor', to: 'observation' },
    ]);
    expect(delegationsInProgress(null, progress)).toEqual([]);
  });
});
