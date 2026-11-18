import { FormsModule } from '@angular/forms';
import { Component, inject } from '@angular/core';
import { RecipeEditorStore } from '../../application/recipe-editor.store';
import { RecipeListStore } from '../../application/recipe-list.store';

@Component({
  selector: 'app-recipe-picker',
  imports: [FormsModule],
  templateUrl: './recipe-picker.html',
  styleUrl: './recipe-picker.scss',
})
export class RecipePicker {
  protected readonly list = inject(RecipeListStore);
  protected readonly editor = inject(RecipeEditorStore);

  protected async open(recipeId: string): Promise<void> {
    if (!recipeId) return;
    await this.editor.load(recipeId);
  }
}
