import { Component, computed, input } from '@angular/core';
import { type ChartUnit, formatValue } from './chart-format';

const RADIUS = 40;
const CIRCUMFERENCE = Math.PI * RADIUS;

@Component({
  selector: 'app-gauge',
  template: `
    <svg viewBox="0 0 100 60" class="gauge" role="img" [attr.aria-label]="label() + ' ' + text()">
      <path class="gauge__track" d="M10 52 A40 40 0 0 1 90 52" />
      <path
        class="gauge__value"
        d="M10 52 A40 40 0 0 1 90 52"
        [style.stroke]="color()"
        [attr.stroke-dasharray]="circumference"
        [attr.stroke-dashoffset]="offset()"
      />
      <text x="50" y="48" text-anchor="middle" class="gauge__text">{{ text() }}</text>
    </svg>
    <div class="gauge__label">{{ label() }}</div>
  `,
  styles: `
    :host {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 0;
    }
    .gauge {
      width: 100%;
      max-width: 9rem;
    }
    .gauge__track,
    .gauge__value {
      fill: none;
      stroke-width: 8;
      stroke-linecap: round;
    }
    .gauge__track {
      stroke: var(--border);
    }
    .gauge__value {
      transition: stroke-dashoffset 0.4s ease;
    }
    .gauge__text {
      fill: var(--text);
      font-size: 14px;
      font-weight: 600;
      font-family: var(--font-sans);
    }
    .gauge__label {
      color: var(--text-muted);
      font-size: 0.8rem;
      text-align: center;
    }
  `,
})
export class Gauge {
  readonly value = input.required<number | null>();
  readonly max = input(100);
  readonly unit = input<ChartUnit>('percent');
  readonly label = input('');
  readonly warnAt = input(0.75);
  readonly dangerAt = input(0.9);

  protected readonly circumference = CIRCUMFERENCE;

  private readonly fraction = computed(() => {
    const value = this.value();
    if (value === null || !Number.isFinite(value)) return 0;
    return Math.min(Math.max(value / this.max(), 0), 1);
  });

  protected readonly offset = computed(() => CIRCUMFERENCE * (1 - this.fraction()));
  protected readonly text = computed(() => formatValue(this.value(), this.unit()));
  protected readonly color = computed(() => {
    const fraction = this.fraction();
    if (fraction >= this.dangerAt()) return 'var(--danger)';
    if (fraction >= this.warnAt()) return 'var(--warning)';
    return 'var(--success)';
  });
}
