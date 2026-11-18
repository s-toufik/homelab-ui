import type { IngredientLine } from '../../domain/ingredient-line';
import type { NutritionTotals } from '../../domain/nutrition';
import type { RecipeDraft, RecipeSummary, RecipeVersion, Sensory, Step } from '../../domain/recipe';
import type { Unit } from '../../domain/unit';

interface IngredientLineJson {
  readonly name: string;
  readonly quantity: number;
  readonly unit: string;
  readonly kcal_per_100g: number;
  readonly protein_per_100g: number;
  readonly carb_per_100g: number;
  readonly fat_per_100g: number;
  readonly ingredient_ref_id?: string | null;
}

interface StepJson {
  readonly text: string;
  readonly tags: readonly string[];
}

interface SensoryJson {
  readonly seasoning: string;
  readonly acidity: string;
  readonly texture: string;
}

interface RecipeDraftJson {
  readonly title: string;
  readonly subtitle: string;
  readonly course: string;
  readonly portions: number;
  readonly prep_time_minutes: number;
  readonly cook_time_minutes: number;
  readonly ingredients: readonly IngredientLineJson[];
  readonly steps: readonly StepJson[];
  readonly sensory: SensoryJson;
  readonly notes: string;
}

interface NutritionJson {
  readonly weight_grams: number;
  readonly kcal: number;
  readonly protein_g: number;
  readonly carb_g: number;
  readonly fat_g: number;
}

export interface RecipeSummaryJson {
  readonly id: string;
  readonly title: string;
  readonly current_version_number: number;
  readonly created_at: string;
  readonly updated_at: string;
}

export interface RecipeVersionJson {
  readonly recipe_id: string;
  readonly version_number: number;
  readonly saved_at: string;
  readonly draft: RecipeDraftJson;
  readonly nutrition_per_portion: NutritionJson;
  readonly nutrition_total: NutritionJson;
}

export function recipeSummaryFromJson(json: RecipeSummaryJson): RecipeSummary {
  return {
    id: json.id,
    title: json.title,
    currentVersionNumber: json.current_version_number,
    createdAt: json.created_at,
    updatedAt: json.updated_at,
  };
}

export function recipeVersionFromJson(json: RecipeVersionJson): RecipeVersion {
  return {
    recipeId: json.recipe_id,
    versionNumber: json.version_number,
    savedAt: json.saved_at,
    draft: draftFromJson(json.draft),
    nutritionPerPortion: nutritionFromJson(json.nutrition_per_portion),
    nutritionTotal: nutritionFromJson(json.nutrition_total),
  };
}

export function draftToJson(draft: RecipeDraft): RecipeDraftJson {
  return {
    title: draft.title,
    subtitle: draft.subtitle,
    course: draft.course,
    portions: draft.portions,
    prep_time_minutes: draft.prepTimeMinutes,
    cook_time_minutes: draft.cookTimeMinutes,
    ingredients: draft.ingredients.map(lineToJson),
    steps: draft.steps.map(stepToJson),
    sensory: draft.sensory,
    notes: draft.notes,
  };
}

function draftFromJson(json: RecipeDraftJson): RecipeDraft {
  return {
    title: json.title,
    subtitle: json.subtitle,
    course: json.course,
    portions: json.portions,
    prepTimeMinutes: json.prep_time_minutes,
    cookTimeMinutes: json.cook_time_minutes,
    ingredients: json.ingredients.map(lineFromJson),
    steps: json.steps.map(stepFromJson),
    sensory: sensoryFromJson(json.sensory),
    notes: json.notes,
  };
}

function lineToJson(line: IngredientLine): IngredientLineJson {
  return {
    name: line.name,
    quantity: line.quantity,
    unit: line.unit,
    kcal_per_100g: line.kcalPer100g,
    protein_per_100g: line.proteinPer100g,
    carb_per_100g: line.carbPer100g,
    fat_per_100g: line.fatPer100g,
    ingredient_ref_id: line.ingredientRefId ?? null,
  };
}

function lineFromJson(json: IngredientLineJson): IngredientLine {
  return {
    name: json.name,
    quantity: json.quantity,
    unit: json.unit as Unit,
    kcalPer100g: json.kcal_per_100g,
    proteinPer100g: json.protein_per_100g,
    carbPer100g: json.carb_per_100g,
    fatPer100g: json.fat_per_100g,
    ingredientRefId: json.ingredient_ref_id ?? undefined,
  };
}

function stepToJson(step: Step): StepJson {
  return { text: step.text, tags: step.tags };
}

function stepFromJson(json: StepJson): Step {
  return { text: json.text, tags: json.tags };
}

function sensoryFromJson(json: SensoryJson): Sensory {
  return { seasoning: json.seasoning, acidity: json.acidity, texture: json.texture };
}

function nutritionFromJson(json: NutritionJson): NutritionTotals {
  return {
    weightGrams: json.weight_grams,
    kcal: json.kcal,
    proteinG: json.protein_g,
    carbG: json.carb_g,
    fatG: json.fat_g,
  };
}
