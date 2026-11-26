import { Component, computed, inject } from '@angular/core';
import { KitchenToastStore } from '../../application/kitchen-toast.store';
import { RecipeEditorStore } from '../../application/recipe-editor.store';
import { RecipeListStore } from '../../application/recipe-list.store';

@Component({
  selector: 'app-version-history',
  imports: [],
  templateUrl: './version-history.html',
  styleUrl: './version-history.scss',
})
export class VersionHistory {
  protected readonly store = inject(RecipeEditorStore);
  private readonly list = inject(RecipeListStore);
  private readonly toast = inject(KitchenToastStore);

  protected readonly label = computed(() =>
    this.store.state() === 'saving' ? 'Saving…' : this.store.isNew() ? 'Create' : 'Save',
  );
  protected readonly description = computed(() =>
    this.store.state() === 'saving'
      ? 'Saving…'
      : this.store.isNew()
        ? 'Create recipe'
        : 'Save version',
  );

  protected async save(): Promise<void> {
    const wasNew = this.store.isNew();
    if (await this.store.save()) {
      await this.list.load();
      this.toast.show(wasNew ? 'Recipe created' : 'Saved as a new version');
    }
  }
}
