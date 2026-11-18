import { Injectable, signal } from '@angular/core';

export interface KitchenToast {
  readonly id: number;
  readonly message: string;
}

const VISIBLE_MS = 2400;

@Injectable({ providedIn: 'root' })
export class KitchenToastStore {
  private nextId = 0;

  readonly toasts = signal<readonly KitchenToast[]>([]);

  show(message: string): void {
    const id = this.nextId++;
    this.toasts.update((toasts) => [...toasts, { id, message }]);
    setTimeout(() => this.dismiss(id), VISIBLE_MS);
  }

  dismiss(id: number): void {
    this.toasts.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }
}
