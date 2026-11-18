import { Injectable, computed, inject, signal } from '@angular/core';
import { newIngredientLine, scaleLine, type IngredientLine } from '../domain/ingredient-line';
import { perPortion, totalsOf, type NutritionTotals } from '../domain/nutrition';
import {
  blankDraft,
  type RecipeDraft,
  type RecipeVersion,
  type Sensory,
  type Step,
} from '../domain/recipe';
import { RecipeRepository } from '../infrastructure/api/recipe.repository';
import { StaleVersionError } from '../infrastructure/api/kitchen-api.client';

export type EditorState = 'idle' | 'loading' | 'saving' | 'error';

@Injectable({ providedIn: 'root' })
export class RecipeEditorStore {
  private readonly repository = inject(RecipeRepository);

  readonly recipeId = signal<string | null>(null);
  readonly versions = signal<readonly RecipeVersion[]>([]);
  readonly viewingVersionNumber = signal<number | null>(null);
  readonly draft = signal<RecipeDraft>(blankDraft());
  readonly autoScale = signal(true);
  readonly state = signal<EditorState>('idle');
  readonly error = signal<string | null>(null);

  readonly isNew = computed(() => this.recipeId() === null);
  readonly latestVersionNumber = computed(() => this.versions().at(-1)?.versionNumber ?? null);
  readonly viewingVersion = computed(
    () => this.versions().find((v) => v.versionNumber === this.viewingVersionNumber()) ?? null,
  );
  readonly isEditingLatest = computed(
    () => this.isNew() || this.viewingVersionNumber() === this.latestVersionNumber(),
  );

  readonly liveNutritionTotal = computed(() => totalsOf(this.draft().ingredients));
  readonly liveNutritionPerPortion = computed(() =>
    perPortion(this.liveNutritionTotal(), Math.max(1, this.draft().portions)),
  );

  readonly displayedDraft = computed(
    () => (this.isEditingLatest() ? this.draft() : this.viewingVersion()?.draft) ?? this.draft(),
  );
  readonly displayedNutritionTotal = computed<NutritionTotals>(
    () =>
      (this.isEditingLatest()
        ? this.liveNutritionTotal()
        : this.viewingVersion()?.nutritionTotal) ?? this.liveNutritionTotal(),
  );
  readonly displayedNutritionPerPortion = computed<NutritionTotals>(
    () =>
      (this.isEditingLatest()
        ? this.liveNutritionPerPortion()
        : this.viewingVersion()?.nutritionPerPortion) ?? this.liveNutritionPerPortion(),
  );

  async load(recipeId: string): Promise<void> {
    this.state.set('loading');
    this.error.set(null);
    try {
      const versions = (await this.repository.listVersions(recipeId)).sort(
        (a, b) => a.versionNumber - b.versionNumber,
      );
      this.recipeId.set(recipeId);
      this.versions.set(versions);
      const latest = versions.at(-1);
      this.viewingVersionNumber.set(latest?.versionNumber ?? null);
      this.draft.set(latest?.draft ?? blankDraft());
      this.state.set('idle');
    } catch (error) {
      this.error.set((error as Error).message);
      this.state.set('error');
    }
  }

  newRecipe(): void {
    this.recipeId.set(null);
    this.versions.set([]);
    this.viewingVersionNumber.set(null);
    this.draft.set(blankDraft());
    this.error.set(null);
    this.state.set('idle');
  }

  selectVersion(versionNumber: number): void {
    this.viewingVersionNumber.set(versionNumber);
  }

  forkToEdit(): void {
    const version = this.viewingVersion();
    if (!version) return;
    this.draft.set(version.draft);
    this.viewingVersionNumber.set(this.latestVersionNumber());
  }

  async save(): Promise<boolean> {
    this.state.set('saving');
    this.error.set(null);
    try {
      if (this.isNew()) {
        const summary = await this.repository.create(this.draft());
        this.recipeId.set(summary.id);
        await this.load(summary.id);
      } else {
        const basedOn = this.latestVersionNumber() ?? 1;
        const version = await this.repository.saveVersion(this.recipeId()!, basedOn, this.draft());
        this.versions.update((versions) => [...versions, version]);
        this.viewingVersionNumber.set(version.versionNumber);
      }
      this.state.set('idle');
      return true;
    } catch (error) {
      this.error.set(
        error instanceof StaleVersionError
          ? 'Someone saved a newer version. Reload the recipe before saving again.'
          : (error as Error).message,
      );
      this.state.set('error');
      return false;
    }
  }

  updateDraft(patch: Partial<RecipeDraft>): void {
    if (!this.isEditingLatest()) return;
    this.draft.update((draft) => ({ ...draft, ...patch }));
  }

  updateSensory(patch: Partial<Sensory>): void {
    this.updateDraft({ sensory: { ...this.draft().sensory, ...patch } });
  }

  setPortions(next: number): void {
    if (!this.isEditingLatest() || next < 1) return;
    this.draft.update((draft) => {
      if (!this.autoScale() || draft.portions <= 0) return { ...draft, portions: next };
      const factor = next / draft.portions;
      return {
        ...draft,
        portions: next,
        ingredients: draft.ingredients.map((line) => scaleLine(line, factor)),
      };
    });
  }

  addIngredient(): void {
    if (!this.isEditingLatest()) return;
    this.draft.update((draft) => ({
      ...draft,
      ingredients: [...draft.ingredients, newIngredientLine()],
    }));
  }

  updateIngredient(index: number, patch: Partial<IngredientLine>): void {
    if (!this.isEditingLatest()) return;
    this.draft.update((draft) => ({
      ...draft,
      ingredients: draft.ingredients.map((line, i) => (i === index ? { ...line, ...patch } : line)),
    }));
  }

  removeIngredient(index: number): void {
    if (!this.isEditingLatest()) return;
    this.draft.update((draft) => ({
      ...draft,
      ingredients: draft.ingredients.filter((_, i) => i !== index),
    }));
  }

  addStep(): void {
    if (!this.isEditingLatest()) return;
    this.draft.update((draft) => ({ ...draft, steps: [...draft.steps, { text: '', tags: [] }] }));
  }

  updateStep(index: number, patch: Partial<Step>): void {
    if (!this.isEditingLatest()) return;
    this.draft.update((draft) => ({
      ...draft,
      steps: draft.steps.map((step, i) => (i === index ? { ...step, ...patch } : step)),
    }));
  }

  removeStep(index: number): void {
    if (!this.isEditingLatest()) return;
    this.draft.update((draft) => ({ ...draft, steps: draft.steps.filter((_, i) => i !== index) }));
  }
}
