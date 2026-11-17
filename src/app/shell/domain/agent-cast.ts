import type { ThemeId } from './theme-preferences';

export const CAST_IDS = [
  'homelab',
  'wizarding',
  'dragon',
  'demigod',
  'regency',
  'pocket',
  'digital',
  'machines',
  'sprites',
] as const;
export type CastId = (typeof CAST_IDS)[number];
export type CastChoice = CastId | 'theme';

export interface CastOption {
  readonly id: CastId;
  readonly name: string;
  readonly description: string;
}

export const CASTS: readonly CastOption[] = [
  {
    id: 'homelab',
    name: 'Homelab',
    description: 'The Maestro, Chef Basile, the Night Owl and friends',
  },
  {
    id: 'wizarding',
    name: 'Wizarding',
    description: 'An archmage, a potioneer, a broom courier, a stargazer',
  },
  {
    id: 'dragon',
    name: 'Dragon Rider',
    description: 'A wing leader, a rider on her dragon, a smith at the forge',
  },
  {
    id: 'demigod',
    name: 'Demigod',
    description: 'An oracle, a satyr cook, a centaur on watch, a hoplite',
  },
  {
    id: 'regency',
    name: 'Regency',
    description: 'A hostess, a coachman, a letter writer, a butler',
  },
  {
    id: 'pocket',
    name: 'Pocket monsters',
    description: 'A bee conductor, a soup-pot crab, a lantern moth, a castle snail',
  },
  {
    id: 'digital',
    name: 'Digital monsters',
    description: 'Data creatures on an old LCD handheld, glitching in trouble',
  },
  {
    id: 'machines',
    name: 'Machines',
    description: 'A dispatch robot, a kettle bot, a rover, a searchlight drone, a vault guard',
  },
  {
    id: 'sprites',
    name: 'Your own sprites',
    description: 'Images you put in public/sprites, one per agent',
  },
];

export const DEFAULT_CAST_CHOICE: CastChoice = 'theme';

const THEME_CASTS: Partial<Record<ThemeId, CastId>> = {
  wizarding: 'wizarding',
  dragon: 'dragon',
  demigod: 'demigod',
  regency: 'regency',
};

export function isCastChoice(value: unknown): value is CastChoice {
  return value === 'theme' || CAST_IDS.includes(value as CastId);
}

export function castForTheme(theme: ThemeId): CastId {
  return THEME_CASTS[theme] ?? 'homelab';
}

export function resolveCast(choice: CastChoice, theme: ThemeId): CastId {
  return choice === 'theme' ? castForTheme(theme) : choice;
}

export function castOption(id: CastId): CastOption {
  return CASTS.find((cast) => cast.id === id) ?? CASTS[0];
}
