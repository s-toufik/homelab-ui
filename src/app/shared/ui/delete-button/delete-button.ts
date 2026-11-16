import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-delete-button',
  host: {
    class: 'delete-button-host',
    '[class.delete-button-host--confirm]': 'confirming()',
  },
  template: `
    <button
      type="button"
      class="delete-button"
      [class.delete-button--confirm]="confirming()"
      [class.delete-button--all]="all()"
      [attr.aria-label]="confirming() ? 'Confirm: ' + label() : label()"
      [title]="confirming() ? 'Tap again to ' + label().toLowerCase() : label()"
      (click)="press($event)"
      (blur)="confirming.set(false)"
    >
      @if (confirming()) {
        <svg viewBox="0 0 24 24" [attr.width]="size()" [attr.height]="size()" aria-hidden="true">
          <path d="M5 12.5l4.5 4.5L19 7.5" />
        </svg>
        @if (count() !== null) {
          <span class="delete-button__count">{{ count() }}</span>
        }
      } @else if (all()) {
        <svg viewBox="0 0 24 24" [attr.width]="size()" [attr.height]="size()" aria-hidden="true">
          <path d="M8 4V2.5h5V4M3 6.5h13M5 6.5l.9 13h7.2l.9-13M9 10v6M12 10v6" />
          <path class="delete-button__back" d="M18 6.5h3M19.5 9l-.8 11.5H16" />
        </svg>
      } @else {
        <svg viewBox="0 0 24 24" [attr.width]="size()" [attr.height]="size()" aria-hidden="true">
          <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />
        </svg>
      }
    </button>
  `,
  styles: `
    :host {
      display: inline-flex;
    }
    .delete-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.2rem;
      min-width: var(--delete-size, 1.9rem);
      height: var(--delete-size, 1.9rem);
      padding: 0 0.35rem;
      border: 0;
      border-radius: 0.45rem;
      background: transparent;
      color: var(--text-muted);
      font: inherit;
      font-size: 0.75rem;
      font-weight: 700;
      cursor: pointer;
      transition:
        background 0.12s,
        color 0.12s;

      svg {
        fill: none;
        stroke: currentColor;
        stroke-width: 2;
        stroke-linecap: round;
        stroke-linejoin: round;
      }

      &:hover {
        background: var(--surface-hover);
        color: var(--danger);
      }

      &:focus-visible {
        outline: 2px solid var(--accent);
        outline-offset: 1px;
      }
    }
    .delete-button__back {
      opacity: 0.55;
    }
    .delete-button--confirm,
    .delete-button--confirm:hover {
      background: var(--danger-soft);
      color: var(--danger);
    }
  `,
})
export class DeleteButton {
  readonly label = input.required<string>();
  readonly all = input(false);
  readonly count = input<number | null>(null);
  readonly size = input(15);
  readonly confirmed = output<void>();

  protected readonly confirming = signal(false);

  protected press(event: MouseEvent): void {
    event.stopPropagation();
    event.preventDefault();
    if (!this.confirming()) {
      this.confirming.set(true);
      return;
    }
    this.confirming.set(false);
    this.confirmed.emit();
  }
}
