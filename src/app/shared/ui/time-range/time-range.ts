import { Component, model, output } from '@angular/core';

export const TIME_RANGES = [
  { id: '15m', label: '15 min', seconds: 900 },
  { id: '1h', label: '1 h', seconds: 3600 },
  { id: '6h', label: '6 h', seconds: 21_600 },
  { id: '24h', label: '24 h', seconds: 86_400 },
  { id: '7d', label: '7 d', seconds: 604_800 },
] as const;

export type TimeRangeId = (typeof TIME_RANGES)[number]['id'];

export interface TimeWindow {
  startSec: number;
  endSec: number;
  stepSec: number;
}

export function timeWindow(id: TimeRangeId, now = Date.now(), points = 240): TimeWindow {
  const seconds = TIME_RANGES.find((range) => range.id === id)?.seconds ?? 3600;
  const endSec = Math.floor(now / 1000);
  const stepSec = Math.max(Math.ceil(seconds / points), 15);
  return { startSec: endSec - seconds, endSec, stepSec };
}

@Component({
  selector: 'app-time-range',
  template: `
    <div class="time-range" role="group" aria-label="Time range">
      @for (option of ranges; track option.id) {
        <button
          type="button"
          class="time-range__option"
          [class.time-range__option--active]="range() === option.id"
          [attr.aria-pressed]="range() === option.id"
          (click)="range.set(option.id)"
        >
          {{ option.label }}
        </button>
      }
      <button type="button" class="time-range__option" title="Refresh" (click)="refresh.emit()">
        ↻
      </button>
    </div>
  `,
  styles: `
    .time-range {
      display: inline-flex;
      border: 1px solid var(--border);
      border-radius: var(--radius);
      overflow: hidden;
    }
    .time-range__option {
      padding: 0.4rem 0.65rem;
      border: none;
      border-right: 1px solid var(--border);
      background: var(--surface-raised);
      color: var(--text-muted);
      font: inherit;
      font-size: 0.8rem;
      cursor: pointer;
      &:last-child {
        border-right: none;
      }
      &:hover {
        color: var(--text);
      }
      &--active {
        background: var(--accent-soft);
        color: var(--accent);
      }
    }
  `,
})
export class TimeRange {
  readonly range = model<TimeRangeId>('1h');
  readonly refresh = output<void>();
  protected readonly ranges = TIME_RANGES;
}
