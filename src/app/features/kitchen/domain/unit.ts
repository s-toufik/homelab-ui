export const UNITS = ['g', 'kg', 'ml', 'cl', 'L', 'càs', 'càc', 'pincée', 'pièce'] as const;

export type Unit = (typeof UNITS)[number];

const GRAM_EQUIVALENT: Record<Unit, number> = {
  g: 1,
  kg: 1000,
  ml: 1,
  cl: 10,
  L: 1000,
  càs: 15,
  càc: 5,
  pincée: 0.5,
  pièce: 50,
};

export function toGrams(quantity: number, unit: Unit): number {
  return quantity * GRAM_EQUIVALENT[unit];
}
