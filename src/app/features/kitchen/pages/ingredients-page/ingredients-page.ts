import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PageHeader } from '@shared/ui/page-header/page-header';
import type { Ingredient } from '../../domain/ingredient';
import { IngredientRepository } from '../../infrastructure/api/ingredient.repository';

const PAGE_SIZE = 50;
const SEARCH_LIMIT = 200;
const SEARCH_DEBOUNCE_MS = 250;
const MIN_SEARCH_LENGTH = 2;

type LoadState = 'loading' | 'ready' | 'error';

@Component({
  selector: 'app-ingredients-page',
  imports: [PageHeader, RouterLink, FormsModule],
  templateUrl: './ingredients-page.html',
  styleUrl: './ingredients-page.scss',
})
export class IngredientsPage {
  private readonly repository = inject(IngredientRepository);
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  protected readonly pageSize = PAGE_SIZE;
  protected readonly ingredients = signal<readonly Ingredient[]>([]);
  protected readonly state = signal<LoadState>('loading');
  protected readonly error = signal<string | null>(null);
  protected readonly offset = signal(0);
  protected readonly search = signal('');
  protected readonly searching = computed(() => this.search().trim().length >= MIN_SEARCH_LENGTH);

  constructor() {
    void this.load();
  }

  async load(): Promise<void> {
    this.state.set('loading');
    this.error.set(null);
    try {
      this.ingredients.set(
        this.searching()
          ? await this.repository.search(this.search().trim(), SEARCH_LIMIT)
          : await this.repository.listAll(PAGE_SIZE, this.offset()),
      );
      this.state.set('ready');
    } catch (error) {
      this.error.set((error as Error).message);
      this.state.set('error');
    }
  }

  protected onSearchInput(value: string): void {
    this.search.set(value);
    this.offset.set(0);
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => void this.load(), SEARCH_DEBOUNCE_MS);
  }

  protected clearSearch(): void {
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.search.set('');
    this.offset.set(0);
    void this.load();
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
