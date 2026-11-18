import { newIngredientLine, scaleLine, type IngredientLine } from './ingredient-line';
import { caloricDensityPer100g, macroSplit, perPortion, totalsOf } from './nutrition';

const CHICKEN: IngredientLine = {
  ...newIngredientLine(),
  name: 'Chicken Breast',
  quantity: 200,
  unit: 'g',
  kcalPer100g: 165,
  proteinPer100g: 31,
  carbPer100g: 0,
  fatPer100g: 3.6,
};

describe('totalsOf', () => {
  it('sums every ingredient line into one total', () => {
    const totals = totalsOf([CHICKEN]);
    expect(totals.weightGrams).toBe(200);
    expect(totals.kcal).toBeCloseTo(330);
    expect(totals.proteinG).toBeCloseTo(62);
  });
});

describe('perPortion', () => {
  it('divides every field by the portion count', () => {
    const totals = totalsOf([CHICKEN]);
    expect(perPortion(totals, 2).kcal).toBeCloseTo(165);
  });
});

describe('caloricDensityPer100g', () => {
  it('is zero for an empty recipe', () => {
    expect(caloricDensityPer100g(totalsOf([]))).toBe(0);
  });
});

describe('macroSplit', () => {
  it('splits calories by macro, not by weight', () => {
    const split = macroSplit(totalsOf([CHICKEN]));
    expect(split.proteinPct).toBeGreaterThan(split.fatPct);
    expect(split.proteinPct + split.carbPct + split.fatPct).toBeCloseTo(100);
  });
});

describe('scaleLine', () => {
  it('rescales the quantity and rounds to two decimals', () => {
    expect(scaleLine(CHICKEN, 1.5).quantity).toBe(300);
  });
});
