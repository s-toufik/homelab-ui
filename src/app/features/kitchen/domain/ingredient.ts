import type { FoodClassification, NutritionalComposition } from './nutritional-composition';

export interface Ingredient {
  readonly ciqualCode: string;
  readonly nameFr: string;
  readonly scientificName: string | null;
  readonly classification: FoodClassification;
  readonly kcalPer100g: number;
  readonly proteinPer100g: number;
  readonly carbPer100g: number;
  readonly fatPer100g: number;
  readonly source: string;
  readonly sourceVersion: string;
  readonly nutrition: NutritionalComposition;
}
