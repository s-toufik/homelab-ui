import { Injectable, inject, signal } from '@angular/core';
import type { RecipeSummary } from '../domain/recipe';
import { RecipeRepository } from '../infrastructure/api/recipe.repository';

export type ListState = 'loading' | 'ready' | 'error';

@Injectable({ providedIn: 'root' })
export class RecipeListStore {
  private readonly repository = inject(RecipeRepository);

  readonly recipes = signal<readonly RecipeSummary[]>([]);
  readonly state = signal<ListState>('loading');
  readonly error = signal<string | null>(null);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.state.set('loading');
    this.error.set(null);
    try {
      this.recipes.set(await this.repository.list());
      this.state.set('ready');
    } catch (error) {
      this.error.set((error as Error).message);
      this.state.set('error');
    }
  }

  async remove(recipeId: string): Promise<boolean> {
    try {
      await this.repository.delete(recipeId);
      this.recipes.update((recipes) => recipes.filter((recipe) => recipe.id !== recipeId));
      return true;
    } catch (error) {
      this.error.set((error as Error).message);
      return false;
    }
  }
}
