import type { FeatureIcon, Hue } from '@shell/domain/homelab-feature';

export interface AgentLook {
  readonly label: string;
  readonly hue: Hue;
  readonly icon: FeatureIcon;
  readonly greeting: string;
  readonly suggestions: readonly string[];
}

const SPARKLE = ['M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z'];

const LOOKS: Readonly<Record<string, AgentLook>> = {
  supervisor: {
    label: 'Assistant',
    hue: 'indigo',
    icon: SPARKLE,
    greeting: 'Ask anything: it hands the work to the right helper.',
    suggestions: ['What can you do?', 'Plan my week'],
  },
  kitchen: {
    label: 'Kitchen',
    hue: 'orange',
    icon: [
      'M4 11h16',
      'M5 11v6a3 3 0 0 0 3 3h8a3 3 0 0 0 3-3v-6',
      'M9 7c0-1 .5-2 1.5-2M13 7c0-1 .5-2 1.5-2',
    ],
    greeting: 'Meals, recipes and the shopping list.',
    suggestions: ["What's for dinner tonight?", 'Shopping list'],
  },
  travel: {
    label: 'Travel',
    hue: 'teal',
    icon: ['M2 16l20-8-6 12-3-5-5 3z', 'M13 15l9-7'],
    greeting: 'Trips, places to see and where to stay.',
    suggestions: ['A weekend away in May', 'Packing list'],
  },
  observation: {
    label: 'Observation',
    hue: 'green',
    icon: [
      'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z',
      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    ],
    greeting: 'Metrics, logs and what the homelab is doing.',
    suggestions: ['Is everything healthy?', 'What used the most memory today?'],
  },
  analysis: {
    label: 'Analysis',
    hue: 'blue',
    icon: ['M4 20V10M10 20V4M16 20v-7M22 20H2'],
    greeting: 'Questions about the data in PostgreSQL and MongoDB.',
    suggestions: ['Which tables are the largest?'],
  },
  coding: {
    label: 'Coding',
    hue: 'slate',
    icon: ['M8 8l-4 4 4 4', 'M16 8l4 4-4 4', 'M14 4l-4 16'],
    greeting: 'Read and change files.',
    suggestions: ['Explain this project'],
  },
  security: {
    label: 'Security',
    hue: 'rose',
    icon: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'],
    greeting: 'Read-only checks of the homelab.',
    suggestions: ['Any open ports I should know about?'],
  },
};

export function agentLook(name: string): AgentLook {
  return (
    LOOKS[name] ?? {
      label: name.charAt(0).toUpperCase() + name.slice(1),
      hue: 'slate',
      icon: SPARKLE,
      greeting: 'Ask anything.',
      suggestions: [],
    }
  );
}
