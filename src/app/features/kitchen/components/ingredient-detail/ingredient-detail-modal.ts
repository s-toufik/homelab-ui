import { Component, effect, inject, input, output, signal } from '@angular/core';
import { ScrollLockDirective } from '@shared/ui/scroll-lock/scroll-lock.directive';
import type { Ingredient } from '../../domain/ingredient';
import { IngredientRepository } from '../../infrastructure/api/ingredient.repository';
import { IngredientDetailCard } from './ingredient-detail-card';

@Component({
  selector: 'app-ingredient-detail-modal',
  imports: [IngredientDetailCard, ScrollLockDirective],
  templateUrl: './ingredient-detail-modal.html',
  styleUrl: './ingredient-detail-modal.scss',
})
export class IngredientDetailModal {
  readonly ciqualCode = input<string | null>(null);
  readonly closed = output<void>();

  private readonly ingredients = inject(IngredientRepository);

  protected readonly ingredient = signal<Ingredient | null>(null);
  protected readonly loading = signal(false);
  protected readonly error = signal<string | null>(null);

  constructor() {
    effect(() => void this.load(this.ciqualCode()));
  }

  private async load(code: string | null): Promise<void> {
    this.ingredient.set(null);
    this.error.set(null);
    if (!code) return;
    this.loading.set(true);
    try {
      this.ingredient.set(await this.ingredients.get(code));
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  protected close(): void {
    this.closed.emit();
  }
}
