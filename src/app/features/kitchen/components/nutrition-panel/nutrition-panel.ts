import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { RecipeEditorStore } from '../../application/recipe-editor.store';
import { caloricDensityPer100g, macroSplit } from '../../domain/nutrition';

type MacroView = 'portion' | 'batch';

@Component({
  selector: 'app-nutrition-panel',
  imports: [DecimalPipe],
  templateUrl: './nutrition-panel.html',
  styleUrl: './nutrition-panel.scss',
})
export class NutritionPanel {
  protected readonly store = inject(RecipeEditorStore);
  protected readonly view = signal<MacroView>('portion');

  protected readonly totals = computed(() =>
    this.view() === 'portion'
      ? this.store.displayedNutritionPerPortion()
      : this.store.displayedNutritionTotal(),
  );
  protected readonly split = computed(() => macroSplit(this.totals()));
  protected readonly density = computed(() => caloricDensityPer100g(this.totals()));
}
