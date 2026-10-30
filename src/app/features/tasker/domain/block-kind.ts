import type { FeatureIcon } from '@shell/domain/homelab-feature';

export const BLOCK_KINDS = ['trigger', 'http', 'code', 'transform', 'output', 'group'] as const;
export type BlockKind = (typeof BLOCK_KINDS)[number];

export function isBlockKind(value: unknown): value is BlockKind {
  return BLOCK_KINDS.includes(value as BlockKind);
}

export interface BlockKindMeta {
  readonly kind: BlockKind;
  readonly label: string;
  readonly color: string;
  readonly icon: FeatureIcon;
  readonly hasInput: boolean;
  readonly hasOutput: boolean;
  readonly creatable: boolean;
}

export const BLOCK_KIND_META: readonly BlockKindMeta[] = [
  {
    kind: 'trigger',
    label: 'Trigger',
    color: '#f59e0b',
    icon: ['M12 20a8 8 0 1 0 0-16 8 8 0 0 0 0 16Z', 'M12 8v4l3 2'],
    hasInput: false,
    hasOutput: true,
    creatable: true,
  },
  {
    kind: 'http',
    label: 'HTTP request',
    color: '#10b981',
    icon: [
      'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
      'M3 12h18',
      'M12 3c3 2.5 3 15.5 0 18c-3-2.5-3-15.5 0-18Z',
    ],
    hasInput: true,
    hasOutput: true,
    creatable: true,
  },
  {
    kind: 'code',
    label: 'Code',
    color: '#3b82f6',
    icon: ['M4 6 10 12 4 18', 'M12 18h8'],
    hasInput: true,
    hasOutput: true,
    creatable: true,
  },
  {
    kind: 'transform',
    label: 'Transform',
    color: '#8b5cf6',
    icon: ['M8 6 3 12l5 6', 'M16 6l5 6-5 6'],
    hasInput: true,
    hasOutput: true,
    creatable: true,
  },
  {
    kind: 'output',
    label: 'Output',
    color: '#e11d48',
    icon: ['M5 12h11', 'M13 6l6 6-6 6'],
    hasInput: true,
    hasOutput: false,
    creatable: true,
  },
  {
    kind: 'group',
    label: 'Group',
    color: '#0ea5e9',
    icon: ['M4 8h12v12H4Z', 'M8 4h12v12'],
    hasInput: true,
    hasOutput: true,
    creatable: false,
  },
];

export const CREATABLE_BLOCK_KINDS = BLOCK_KIND_META.filter((meta) => meta.creatable);

export function blockKindMeta(kind: BlockKind): BlockKindMeta {
  return BLOCK_KIND_META.find((meta) => meta.kind === kind)!;
}
