import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PageHeader } from '@shared/ui/page-header/page-header';
import type { Ingredient } from '../../domain/ingredient';
import { IngredientRepository } from '../../infrastructure/api/ingredient.repository';

const PAGE_SIZE = 50;

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-ingredients-page',
  imports: [PageHeader, RouterLink],
  templateUrl: './ingredients-page.html',
  styleUrl: './ingredients-page.scss',
})
export class IngredientsPage {
  private readonly repository = inject(IngredientRepository);

  protected readonly pageSize = PAGE_SIZE;
  protected readonly ingredients = signal<readonly Ingredient[]>([]);
  protected readonly state = signal<LoadState>('loading');
  protected readonly error = signal<string | null>(null);
  protected readonly offset = signal(0);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.state.set('loading');
    this.error.set(null);
    try {
      this.ingredients.set(await this.repository.listAll(PAGE_SIZE, this.offset()));
      this.state.set('ready');
    } catch (error) {
      this.error.set((error as Error).message);
      this.state.set('error');
    }
  }

  protected previous(): void {
    this.offset.set(Math.max(0, this.offset() - PAGE_SIZE));
    void this.load();
  }

  protected next(): void {
    if (this.ingredients().length < PAGE_SIZE) return;
    this.offset.update((current) => current + PAGE_SIZE);
    void this.load();
  }

  protected readonly pageFirst = () => this.offset() + 1;
  protected readonly pageLast = () => this.offset() + this.ingredients().length;
}
