import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { RecipeListStore } from '../../application/recipe-list.store';
import { COURSES, type RecipeSummary } from '../../domain/recipe';

@Component({
  selector: 'app-recipes-page',
  imports: [PageHeader, DatePipe, RouterLink],
  templateUrl: './recipes-page.html',
  styleUrl: './recipes-page.scss',
})
export class RecipesPage {
  protected readonly store = inject(RecipeListStore);
  private readonly router = inject(Router);

  protected readonly groups = computed(() => {
    const recipes = this.store.recipes();
    return COURSES.map((course) => ({
      course,
      recipes: recipes.filter((recipe) => recipe.course === course),
    })).filter((group) => group.recipes.length > 0);
  });

  protected readonly uncategorized = computed(() =>
    this.store
      .recipes()
      .filter((recipe) => !(COURSES as readonly string[]).includes(recipe.course)),
  );

  protected async open(recipe: RecipeSummary): Promise<void> {
    await this.router.navigate(['/kitchen'], { queryParams: { recipe: recipe.id } });
  }
}
