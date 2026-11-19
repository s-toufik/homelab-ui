import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Component, inject, input, output } from '@angular/core';
import { IngredientSearchStore } from '../../application/ingredient-search.store';
import type { Ingredient } from '../../domain/ingredient';
import { lineGrams, lineKcal, type IngredientLine } from '../../domain/ingredient-line';
import { UNITS } from '../../domain/unit';

@Component({
  selector: 'app-ingredient-row',
  imports: [FormsModule, DecimalPipe],
  providers: [IngredientSearchStore],
  templateUrl: './ingredient-row.html',
  styleUrl: './ingredient-row.scss',
})
export class IngredientRow {
  readonly line = input.required<IngredientLine>();
  readonly readonly = input(false);
  readonly changed = output<Partial<IngredientLine>>();
  readonly removed = output<void>();
  readonly editMacros = output<void>();
  readonly showDetails = output<void>();

  protected readonly search = inject(IngredientSearchStore);
  protected readonly units = UNITS;

  protected grams(): number {
    return lineGrams(this.line());
  }

  protected kcal(): number {
    return lineKcal(this.line());
  }

  protected step(delta: number): void {
    const line = this.line();
    const magnitude = line.unit === 'g' || line.unit === 'ml' ? (line.quantity >= 100 ? 10 : 5) : 1;
    const next = Math.max(0, Math.round((line.quantity + delta * magnitude) * 10) / 10);
    this.changed.emit({ quantity: next });
  }

  protected onNameInput(value: string): void {
    this.changed.emit({ name: value, ingredientRefId: undefined });
    this.search.search(value);
  }

  protected pick(ingredient: Ingredient): void {
    this.changed.emit({
      name: ingredient.nameFr,
      ingredientRefId: ingredient.ciqualCode,
      kcalPer100g: ingredient.kcalPer100g,
      proteinPer100g: ingredient.proteinPer100g,
      carbPer100g: ingredient.carbPer100g,
      fatPer100g: ingredient.fatPer100g,
    });
    this.search.clear();
  }

  protected hideSuggestionsDelayed(): void {
    setTimeout(() => this.search.clear(), 150);
  }
}
