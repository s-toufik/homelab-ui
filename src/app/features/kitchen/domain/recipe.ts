import type { IngredientLine } from './ingredient-line';
import type { NutritionTotals } from './nutrition';

export const COURSES = ['Trial', 'Starter', 'Main', 'Sauce / Jus', 'Pastry'] as const;

export interface Sensory {
  readonly seasoning: string;
  readonly acidity: string;
  readonly texture: string;
}

export interface Step {
  readonly text: string;
  readonly tags: readonly string[];
}

export interface RecipeDraft {
  readonly title: string;
  readonly subtitle: string;
  readonly course: string;
  readonly portions: number;
  readonly prepTimeMinutes: number;
  readonly cookTimeMinutes: number;
  readonly ingredients: readonly IngredientLine[];
  readonly steps: readonly Step[];
  readonly sensory: Sensory;
  readonly notes: string;
}

export interface RecipeSummary {
  readonly id: string;
  readonly title: string;
  readonly course: string;
  readonly currentVersionNumber: number;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface RecipeVersion {
  readonly recipeId: string;
  readonly versionNumber: number;
  readonly savedAt: string;
  readonly draft: RecipeDraft;
  readonly nutritionPerPortion: NutritionTotals;
  readonly nutritionTotal: NutritionTotals;
}

export function defaultSensory(): Sensory {
  return { seasoning: 'Balanced', acidity: 'Balanced', texture: 'Spot-On' };
}

export function blankDraft(): RecipeDraft {
  return {
    title: '',
    subtitle: '',
    course: COURSES[0],
    portions: 4,
    prepTimeMinutes: 15,
    cookTimeMinutes: 15,
    ingredients: [],
    steps: [],
    sensory: defaultSensory(),
    notes: '',
  };
}
