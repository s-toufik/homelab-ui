import type { SwarmPhase } from '@shared/ui/swarm-avatar/swarm-avatar';

export type AgentMood = 'idle' | 'working' | 'waiting' | 'trouble';

export interface AgentSignals {
  readonly localPhase: SwarmPhase | null;
  readonly serverActive: number;
  readonly waitingPlans: number;
}

export function moodOf(signals: AgentSignals): AgentMood {
  if (signals.localPhase === 'error') return 'trouble';
  if ((signals.localPhase && signals.localPhase !== 'idle') || signals.serverActive > 0)
    return 'working';
  if (signals.waitingPlans > 0) return 'waiting';
  return 'idle';
}

const SERVICE = /(?:^|\/)agent-([a-z][a-z0-9-]*)$/;

export function activeByAgent(
  samples: readonly { labels: Record<string, string>; value: number }[],
): Record<string, number> {
  const active: Record<string, number> = {};
  for (const sample of samples) {
    const service = sample.labels['service_name'] ?? sample.labels['job'] ?? '';
    const name = SERVICE.exec(service)?.[1];
    if (!name || !Number.isFinite(sample.value)) continue;
    active[name] = (active[name] ?? 0) + sample.value;
  }
  return active;
}

const PHRASES: Readonly<Record<string, Record<AgentMood, string>>> = {
  supervisor: {
    idle: 'Baton down, ready to hand out the work',
    working: 'Conducting: passing the work to the right helper',
    waiting: 'A plan is waiting for your OK',
    trouble: 'Something went wrong in the last answer',
  },
  kitchen: {
    idle: 'Kitchen is tidy, the stove is warm',
    working: 'Cooking up an answer',
    waiting: 'A menu is waiting for your OK',
    trouble: 'Something burnt: the last answer failed',
  },
  travel: {
    idle: 'Bags packed, ready to go',
    working: 'Plotting the route',
    waiting: 'A trip plan is waiting for your OK',
    trouble: 'Flight delayed: the last answer failed',
  },
  observation: {
    idle: 'Keeping a quiet watch',
    working: 'Scanning metrics, logs and traces',
    waiting: 'A plan is waiting for your OK',
    trouble: 'Lost the signal: the last answer failed',
  },
  analysis: {
    idle: 'Charts ready, waiting for a question',
    working: 'Crunching the numbers',
    waiting: 'A query plan is waiting for your OK',
    trouble: 'The numbers did not add up: the last answer failed',
  },
  coding: {
    idle: 'Editor open, cursor blinking',
    working: 'Typing away',
    waiting: 'A change is waiting for your OK',
    trouble: 'Build broken: the last answer failed',
  },
  security: {
    idle: 'On guard',
    working: 'Checking every door',
    waiting: 'A check is waiting for your OK',
    trouble: 'Alarm: the last answer failed',
  },
};

export function phraseOf(agent: string, mood: AgentMood): string {
  const phrases = PHRASES[agent];
  if (phrases) return phrases[mood];
  return {
    idle: 'Resting',
    working: 'Working on an answer',
    waiting: 'A plan is waiting for your OK',
    trouble: 'The last answer failed',
  }[mood];
}
