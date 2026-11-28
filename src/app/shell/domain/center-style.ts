export const CENTER_STYLE_IDS = ['sky', 'ferrofluid', 'atlas', 'starmap', 'contour'] as const;
export type CenterStyleId = (typeof CENTER_STYLE_IDS)[number];

export interface CenterStyleOption {
  readonly id: CenterStyleId;
  readonly name: string;
  readonly description: string;
}

export const CENTER_STYLES: readonly CenterStyleOption[] = [
  {
    id: 'sky',
    name: 'Sky',
    description: 'Constellations on a turning sky, one star per page',
  },
  {
    id: 'ferrofluid',
    name: 'Ferrofluid',
    description: 'A magnetic liquid globe; a scope’s field erupts in spikes that lift its pages',
  },
  {
    id: 'atlas',
    name: 'Atlas',
    description: 'A glass tower per scope on its own continent, rising floor by floor',
  },
  {
    id: 'starmap',
    name: 'Starmap',
    description: 'A star chart with a planet per scope and its pages on the orbits',
  },
  {
    id: 'contour',
    name: 'Contour',
    description: 'A map in glowing contour lines, one mountain per scope',
  },
];

export const DEFAULT_CENTER_STYLE: CenterStyleId = 'sky';

export function isCenterStyle(value: unknown): value is CenterStyleId {
  return CENTER_STYLE_IDS.includes(value as CenterStyleId);
}
