import { Injectable, inject } from '@angular/core';
import type { RecipeDraft, RecipeSummary, RecipeVersion } from '../../domain/recipe';
import { KitchenApiClient } from './kitchen-api.client';
import {
  draftToJson,
  recipeSummaryFromJson,
  recipeVersionFromJson,
  type RecipeSummaryJson,
  type RecipeVersionJson,
} from './recipe-mapper';

@Injectable({ providedIn: 'root' })
export class RecipeRepository {
  private readonly client = inject(KitchenApiClient);

  async list(): Promise<RecipeSummary[]> {
    const { recipes } = await this.client.get<{ recipes: RecipeSummaryJson[] }>('/v1/recipes');
    return recipes.map(recipeSummaryFromJson);
  }

  async create(draft: RecipeDraft): Promise<RecipeSummary> {
    const json = await this.client.post<RecipeSummaryJson>('/v1/recipes', draftToJson(draft));
    return recipeSummaryFromJson(json);
  }

  async listVersions(recipeId: string): Promise<RecipeVersion[]> {
    const { versions } = await this.client.get<{ versions: RecipeVersionJson[] }>(
      `/v1/recipes/${encodeURIComponent(recipeId)}/versions`,
    );
    return versions.map(recipeVersionFromJson);
  }

  async saveVersion(
    recipeId: string,
    basedOnVersion: number,
    draft: RecipeDraft,
  ): Promise<RecipeVersion> {
    const json = await this.client.post<RecipeVersionJson>(
      `/v1/recipes/${encodeURIComponent(recipeId)}/versions`,
      { based_on_version: basedOnVersion, draft: draftToJson(draft) },
    );
    return recipeVersionFromJson(json);
  }
}
