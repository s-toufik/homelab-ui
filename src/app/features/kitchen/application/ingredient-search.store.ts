import { Injectable, inject, signal } from '@angular/core';
import type { Ingredient } from '../domain/ingredient';
import { IngredientRepository } from '../infrastructure/api/ingredient.repository';

const DEBOUNCE_MS = 250;
const MIN_QUERY_LENGTH = 2;

@Injectable()
export class IngredientSearchStore {
  private readonly repository = inject(IngredientRepository);
  private timer: ReturnType<typeof setTimeout> | null = null;

  readonly query = signal('');
  readonly results = signal<readonly Ingredient[]>([]);
  readonly searching = signal(false);

  search(query: string): void {
    this.query.set(query);
    if (this.timer) clearTimeout(this.timer);
    if (query.trim().length < MIN_QUERY_LENGTH) {
      this.results.set([]);
      this.searching.set(false);
      return;
    }
    this.searching.set(true);
    this.timer = setTimeout(() => void this.run(query), DEBOUNCE_MS);
  }

  clear(): void {
    if (this.timer) clearTimeout(this.timer);
    this.query.set('');
    this.results.set([]);
    this.searching.set(false);
  }

  private async run(query: string): Promise<void> {
    try {
      const results = await this.repository.search(query);
      if (this.query() === query) this.results.set(results);
    } catch {
      this.results.set([]);
    } finally {
      if (this.query() === query) this.searching.set(false);
    }
  }
}
