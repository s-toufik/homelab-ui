import { Component, computed, input } from '@angular/core';
import type { Ingredient } from '../../domain/ingredient';
import { nutrientSections } from '../../domain/nutritional-composition';

@Component({
  selector: 'app-ingredient-detail-card',
  templateUrl: './ingredient-detail-card.html',
  styleUrl: './ingredient-detail-card.scss',
})
export class IngredientDetailCard {
  readonly ingredient = input.required<Ingredient>();

  protected readonly sections = computed(() => nutrientSections(this.ingredient().nutrition));

  protected readonly breadcrumb = computed(() => {
    const classification = this.ingredient().classification;
    return [
      classification.group_name,
      classification.subgroup_name,
      classification.sub_subgroup_name,
    ].filter(Boolean);
  });
}
