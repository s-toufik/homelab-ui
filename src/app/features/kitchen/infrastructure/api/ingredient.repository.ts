import { Injectable, inject } from '@angular/core';
import type { Ingredient } from '../../domain/ingredient';
import type {
  FoodClassification,
  NutritionalComposition,
} from '../../domain/nutritional-composition';
import { KitchenApiClient } from './kitchen-api.client';

interface IngredientJson {
  readonly ciqual_code: string;
  readonly name_fr: string;
  readonly scientific_name: string | null;
  readonly classification: FoodClassification;
  readonly kcal_per_100g: number;
  readonly protein_per_100g: number;
  readonly carb_per_100g: number;
  readonly fat_per_100g: number;
  readonly source: string;
  readonly source_version: string;
  readonly nutrition: NutritionalComposition;
}

function fromJson(json: IngredientJson): Ingredient {
  return {
    ciqualCode: json.ciqual_code,
    nameFr: json.name_fr,
    scientificName: json.scientific_name,
    classification: json.classification,
    kcalPer100g: json.kcal_per_100g,
    proteinPer100g: json.protein_per_100g,
    carbPer100g: json.carb_per_100g,
    fatPer100g: json.fat_per_100g,
    source: json.source,
    sourceVersion: json.source_version,
    nutrition: json.nutrition,
  };
}

@Injectable({ providedIn: 'root' })
export class IngredientRepository {
  private readonly client = inject(KitchenApiClient);

  async search(query: string, limit = 20): Promise<Ingredient[]> {
    const { ingredients } = await this.client.get<{ ingredients: IngredientJson[] }>(
      `/v1/ingredients?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
    return ingredients.map(fromJson);
  }

  async listAll(limit = 50, offset = 0): Promise<Ingredient[]> {
    const { ingredients } = await this.client.get<{ ingredients: IngredientJson[] }>(
      `/v1/ingredients?limit=${limit}&offset=${offset}`,
    );
    return ingredients.map(fromJson);
  }

  async get(ciqualCode: string): Promise<Ingredient> {
    const json = await this.client.get<IngredientJson>(
      `/v1/ingredients/${encodeURIComponent(ciqualCode)}`,
    );
    return fromJson(json);
  }

  async getOrCreate(
    nameFr: string,
    macros: {
      kcalPer100g: number;
      proteinPer100g: number;
      carbPer100g: number;
      fatPer100g: number;
    },
  ): Promise<Ingredient> {
    const json = await this.client.post<IngredientJson>('/v1/ingredients', {
      name_fr: nameFr,
      kcal_per_100g: macros.kcalPer100g,
      protein_per_100g: macros.proteinPer100g,
      carb_per_100g: macros.carbPer100g,
      fat_per_100g: macros.fatPer100g,
    });
    return fromJson(json);
  }
}
