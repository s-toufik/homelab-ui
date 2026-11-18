import { FormsModule } from '@angular/forms';
import { Component, computed, inject } from '@angular/core';
import { RecipeEditorStore } from '../../application/recipe-editor.store';
import { COURSES } from '../../domain/recipe';

@Component({
  selector: 'app-recipe-overview',
  imports: [FormsModule],
  templateUrl: './recipe-overview.html',
  styleUrl: './recipe-overview.scss',
})
export class RecipeOverview {
  protected readonly store = inject(RecipeEditorStore);
  protected readonly courses = COURSES;

  protected readonly versionIndex = computed(() =>
    this.store.versions().findIndex((v) => v.versionNumber === this.store.viewingVersionNumber()),
  );
  protected readonly hasPrevVersion = computed(() => this.versionIndex() > 0);
  protected readonly hasNextVersion = computed(
    () => this.versionIndex() >= 0 && this.versionIndex() < this.store.versions().length - 1,
  );

  protected setCourse(course: string): void {
    this.store.updateDraft({ course });
  }

  protected stepVersion(delta: number): void {
    const versions = this.store.versions();
    const next = versions[this.versionIndex() + delta];
    if (next) this.store.selectVersion(next.versionNumber);
  }

  protected changePortions(delta: number): void {
    this.store.setPortions(Math.max(1, this.store.draft().portions + delta));
  }

  protected changePrepTime(delta: number): void {
    const next = Math.max(0, this.store.draft().prepTimeMinutes + delta);
    this.store.updateDraft({ prepTimeMinutes: next });
  }

  protected changeCookTime(delta: number): void {
    const next = Math.max(0, this.store.draft().cookTimeMinutes + delta);
    this.store.updateDraft({ cookTimeMinutes: next });
  }
}
