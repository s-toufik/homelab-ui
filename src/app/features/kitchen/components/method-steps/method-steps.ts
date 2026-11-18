import { FormsModule } from '@angular/forms';
import { Component, inject } from '@angular/core';
import { RecipeEditorStore } from '../../application/recipe-editor.store';

const QUICK_TAGS = [
  '180°C',
  '200°C',
  'Sous-vide 62°C',
  '5 min',
  '12 min',
  'Reduce 50%',
  'Rest 8 min',
];
const MAX_QUICK_TAGS = 5;

@Component({
  selector: 'app-method-steps',
  imports: [FormsModule],
  templateUrl: './method-steps.html',
  styleUrl: './method-steps.scss',
})
export class MethodSteps {
  protected readonly store = inject(RecipeEditorStore);

  protected quickTagsFor(tags: readonly string[]): readonly string[] {
    return QUICK_TAGS.filter((tag) => !tags.includes(tag)).slice(0, MAX_QUICK_TAGS);
  }

  protected toggleTag(index: number, tag: string, tags: readonly string[]): void {
    const next = tags.includes(tag) ? tags.filter((t) => t !== tag) : [...tags, tag];
    this.store.updateStep(index, { tags: next });
  }
}
