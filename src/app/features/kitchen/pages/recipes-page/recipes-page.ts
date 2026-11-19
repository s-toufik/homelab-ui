import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { RecipeListStore } from '../../application/recipe-list.store';
import { COURSES, type RecipeSummary } from '../../domain/recipe';

@Component({
  selector: 'app-recipes-page',
  imports: [PageHeader, DatePipe, RouterLink, FormsModule],
  templateUrl: './recipes-page.html',
  styleUrl: './recipes-page.scss',
})
export class RecipesPage {
  protected readonly store = inject(RecipeListStore);
  private readonly router = inject(Router);

  protected readonly search = signal('');

  private readonly filtered = computed(() => {
    const needle = this.search().trim().toLowerCase();
    const recipes = this.store.recipes();
    return needle
      ? recipes.filter((recipe) => (recipe.title || '').toLowerCase().includes(needle))
      : recipes;
  });

  protected readonly groups = computed(() => {
    const recipes = this.filtered();
    return COURSES.map((course) => ({
      course,
      recipes: recipes.filter((recipe) => recipe.course === course),
    })).filter((group) => group.recipes.length > 0);
  });

  protected readonly uncategorized = computed(() =>
    this.filtered().filter((recipe) => !(COURSES as readonly string[]).includes(recipe.course)),
  );

  protected readonly noMatches = computed(
    () =>
      this.search().trim().length > 0 &&
      this.store.recipes().length > 0 &&
      this.groups().length === 0 &&
      this.uncategorized().length === 0,
  );

  protected async open(recipe: RecipeSummary): Promise<void> {
    await this.router.navigate(['/kitchen'], { queryParams: { recipe: recipe.id } });
  }
}
