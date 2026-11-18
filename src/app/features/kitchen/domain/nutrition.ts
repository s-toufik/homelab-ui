import {
  lineCarb,
  lineFat,
  lineGrams,
  lineKcal,
  lineProtein,
  type IngredientLine,
} from './ingredient-line';

const PROTEIN_KCAL_PER_GRAM = 4;
const CARB_KCAL_PER_GRAM = 4;
const FAT_KCAL_PER_GRAM = 9;

export interface MacroSplit {
  readonly proteinPct: number;
  readonly carbPct: number;
  readonly fatPct: number;
}

export interface NutritionTotals {
  readonly weightGrams: number;
  readonly kcal: number;
  readonly proteinG: number;
  readonly carbG: number;
  readonly fatG: number;
}

export function totalsOf(lines: readonly IngredientLine[]): NutritionTotals {
  let weightGrams = 0;
  let kcal = 0;
  let proteinG = 0;
  let carbG = 0;
  let fatG = 0;
  for (const line of lines) {
    weightGrams += lineGrams(line);
    kcal += lineKcal(line);
    proteinG += lineProtein(line);
    carbG += lineCarb(line);
    fatG += lineFat(line);
  }
  return { weightGrams, kcal, proteinG, carbG, fatG };
}

export function perPortion(totals: NutritionTotals, portions: number): NutritionTotals {
  return {
    weightGrams: totals.weightGrams / portions,
    kcal: totals.kcal / portions,
    proteinG: totals.proteinG / portions,
    carbG: totals.carbG / portions,
    fatG: totals.fatG / portions,
  };
}

export function caloricDensityPer100g(totals: NutritionTotals): number {
  return totals.weightGrams > 0 ? (totals.kcal / totals.weightGrams) * 100 : 0;
}

export function macroSplit(totals: NutritionTotals): MacroSplit {
  const macroKcal =
    totals.proteinG * PROTEIN_KCAL_PER_GRAM +
    totals.carbG * CARB_KCAL_PER_GRAM +
    totals.fatG * FAT_KCAL_PER_GRAM;
  if (macroKcal <= 0) return { proteinPct: 0, carbPct: 0, fatPct: 0 };
  const proteinPct = ((totals.proteinG * PROTEIN_KCAL_PER_GRAM) / macroKcal) * 100;
  const carbPct = ((totals.carbG * CARB_KCAL_PER_GRAM) / macroKcal) * 100;
  const fatPct = Math.max(0, 100 - proteinPct - carbPct);
  return { proteinPct, carbPct, fatPct };
}
