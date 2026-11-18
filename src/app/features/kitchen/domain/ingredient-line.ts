import { toGrams, type Unit } from './unit';

export interface IngredientLine {
  readonly name: string;
  readonly quantity: number;
  readonly unit: Unit;
  readonly kcalPer100g: number;
  readonly proteinPer100g: number;
  readonly carbPer100g: number;
  readonly fatPer100g: number;
  readonly ingredientRefId?: string;
}

export function lineGrams(line: IngredientLine): number {
  return toGrams(line.quantity, line.unit);
}

export function lineKcal(line: IngredientLine): number {
  return (lineGrams(line) / 100) * line.kcalPer100g;
}

export function lineProtein(line: IngredientLine): number {
  return (lineGrams(line) / 100) * line.proteinPer100g;
}

export function lineCarb(line: IngredientLine): number {
  return (lineGrams(line) / 100) * line.carbPer100g;
}

export function lineFat(line: IngredientLine): number {
  return (lineGrams(line) / 100) * line.fatPer100g;
}

export function scaleLine(line: IngredientLine, factor: number): IngredientLine {
  return { ...line, quantity: Math.round(line.quantity * factor * 100) / 100 };
}

export function newIngredientLine(): IngredientLine {
  return {
    name: '',
    quantity: 100,
    unit: 'g',
    kcalPer100g: 0,
    proteinPer100g: 0,
    carbPer100g: 0,
    fatPer100g: 0,
  };
}
