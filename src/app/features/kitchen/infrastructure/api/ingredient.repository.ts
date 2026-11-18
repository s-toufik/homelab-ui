import { Injectable, inject } from '@angular/core';
import type { Ingredient } from '../../domain/ingredient';
import { KitchenApiClient } from './kitchen-api.client';

interface IngredientJson {
  readonly ciqual_code: string;
  readonly name_fr: string;
  readonly kcal_per_100g: number;
  readonly protein_per_100g: number;
  readonly carb_per_100g: number;
  readonly fat_per_100g: number;
}

@Injectable({ providedIn: 'root' })
export class IngredientRepository {
  private readonly client = inject(KitchenApiClient);

  async search(query: string, limit = 20): Promise<Ingredient[]> {
    const { ingredients } = await this.client.get<{ ingredients: IngredientJson[] }>(
      `/v1/ingredients?q=${encodeURIComponent(query)}&limit=${limit}`,
    );
    return ingredients.map((json) => ({
      ciqualCode: json.ciqual_code,
      nameFr: json.name_fr,
      kcalPer100g: json.kcal_per_100g,
      proteinPer100g: json.protein_per_100g,
      carbPer100g: json.carb_per_100g,
      fatPer100g: json.fat_per_100g,
    }));
  }
}
