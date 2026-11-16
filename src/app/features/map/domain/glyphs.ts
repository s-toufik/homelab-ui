import type { FeatureIcon } from '@shell/domain/homelab-feature';
import type { Glyph } from './map-layout';

export const GLYPHS: Readonly<Record<Glyph, FeatureIcon>> = {
  gate: ['M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z'],
  user: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 21a8 8 0 0 1 16 0'],
  app: ['M4 5h16v14H4z', 'M4 9h16'],
  agent: ['M5 5h14v10H9l-4 4z'],
  tool: ['M14 6l4 4-8 8H6v-4z'],
  model: ['M8 8h8v8H8z', 'M4 10h2M4 14h2M18 10h2M18 14h2M10 4v2M14 4v2M10 18v2M14 18v2'],
  db: [
    'M4 6c0-1.7 3.6-3 8-3s8 1.3 8 3-3.6 3-8 3-8-1.3-8-3Z',
    'M4 6v12c0 1.7 3.6 3 8 3s8-1.3 8-3V6',
    'M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3',
  ],
  queue: ['M4 8h13l-3-3M20 16H7l3 3'],
  chart: ['M4 20V10M10 20V4M16 20v-7M22 20H2'],
  logs: ['M5 6h14M5 12h14M5 18h9'],
  trace: ['M4 6h8M8 12h10M6 18h6'],
  job: ['M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z', 'M12 7v5l3 2'],
  kube: ['M12 3l8 4.5v9L12 21l-8-4.5v-9z', 'M12 12l8-4.5M12 12v9M12 12L4 7.5'],
};

export const STATE_COLOR: Readonly<Record<string, string>> = {
  ok: 'var(--success)',
  warn: 'var(--warning)',
  fail: 'var(--danger)',
  done: 'var(--text-muted)',
  unknown: 'var(--text-muted)',
};
