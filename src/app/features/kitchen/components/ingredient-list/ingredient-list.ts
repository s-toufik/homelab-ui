import { FormsModule } from '@angular/forms';
import { Component, computed, inject, signal } from '@angular/core';
import { ScrollLockDirective } from '@shared/ui/scroll-lock/scroll-lock.directive';
import { KitchenToastStore } from '../../application/kitchen-toast.store';
import { RecipeEditorStore } from '../../application/recipe-editor.store';
import type { IngredientLine } from '../../domain/ingredient-line';
import { IngredientRepository } from '../../infrastructure/api/ingredient.repository';
import { IngredientDetailModal } from '../ingredient-detail/ingredient-detail-modal';
import { IngredientRow } from './ingredient-row';

const PANTRY_STAPLES = ['Beurre doux', 'Huile d’olive', 'Sel fin', 'Farine T55', 'Échalote', 'Ail'];

@Component({
  selector: 'app-ingredient-list',
  imports: [IngredientRow, FormsModule, IngredientDetailModal, ScrollLockDirective],
  templateUrl: './ingredient-list.html',
  styleUrl: './ingredient-list.scss',
})
export class IngredientList {
  protected readonly store = inject(RecipeEditorStore);
  private readonly ingredients = inject(IngredientRepository);
  private readonly toast = inject(KitchenToastStore);

  protected readonly pantryStaples = PANTRY_STAPLES;
  protected readonly editingIndex = signal<number | null>(null);
  protected readonly editingLine = computed(() => {
    const index = this.editingIndex();
    return index === null ? null : (this.store.draft().ingredients[index] ?? null);
  });

  protected readonly detailCode = signal<string | null>(null);

  protected openIngredientDetails(index: number): void {
    this.detailCode.set(this.store.draft().ingredients[index]?.ingredientRefId ?? null);
  }

  protected onChanged(index: number, patch: Partial<IngredientLine>): void {
    this.store.updateIngredient(index, patch);
  }

  protected async quickAdd(name: string): Promise<void> {
    const results = await this.ingredients.search(name, 1);
    const match = results[0];
    this.store.addIngredient();
    const index = this.store.draft().ingredients.length - 1;
    if (match) {
      this.store.updateIngredient(index, {
        name: match.nameFr,
        ingredientRefId: match.ciqualCode,
        kcalPer100g: match.kcalPer100g,
        proteinPer100g: match.proteinPer100g,
        carbPer100g: match.carbPer100g,
        fatPer100g: match.fatPer100g,
      });
      this.toast.show(`Added ${match.nameFr}`);
    } else {
      this.store.updateIngredient(index, { name });
      this.toast.show(`${name} isn't in the catalog yet — add its macros manually`);
    }
  }

  protected readonly modalKcal = signal(0);
  protected readonly modalProtein = signal(0);
  protected readonly modalCarb = signal(0);
  protected readonly modalFat = signal(0);

  protected openMacroModal(index: number): void {
    const line = this.store.draft().ingredients[index];
    if (!line) return;
    this.modalKcal.set(line.kcalPer100g);
    this.modalProtein.set(line.proteinPer100g);
    this.modalCarb.set(line.carbPer100g);
    this.modalFat.set(line.fatPer100g);
    this.editingIndex.set(index);
  }

  protected closeMacroModal(): void {
    this.editingIndex.set(null);
  }

  protected async saveMacroModal(): Promise<void> {
    const index = this.editingIndex();
    if (index === null) return;
    const line = this.store.draft().ingredients[index];
    if (!line) return;

    const macros = {
      kcalPer100g: Math.max(0, this.modalKcal()),
      proteinPer100g: Math.max(0, this.modalProtein()),
      carbPer100g: Math.max(0, this.modalCarb()),
      fatPer100g: Math.max(0, this.modalFat()),
    };
    this.store.updateIngredient(index, macros);
    this.editingIndex.set(null);

    if (line.ingredientRefId || !line.name.trim()) {
      this.toast.show('Updated custom ingredient macros');
      return;
    }

    try {
      const ingredient = await this.ingredients.getOrCreate(line.name, macros);
      this.store.updateIngredient(index, {
        name: ingredient.nameFr,
        ingredientRefId: ingredient.ciqualCode,
        kcalPer100g: ingredient.kcalPer100g,
        proteinPer100g: ingredient.proteinPer100g,
        carbPer100g: ingredient.carbPer100g,
        fatPer100g: ingredient.fatPer100g,
      });
      this.toast.show(
        ingredient.source === 'custom'
          ? `${ingredient.nameFr} added to the catalog`
          : `Matched to ${ingredient.nameFr} in the catalog`,
      );
    } catch {
      this.toast.show("Couldn't save to the catalog — kept locally for this recipe");
    }
  }
}
