import { DatePipe } from '@angular/common';
import { Component, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TimeSeriesChart } from '@shared/ui/charts/time-series-chart';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { TimeRange } from '@shared/ui/time-range/time-range';
import { LogsStore } from '../../application/logs.store';
import { type LogLevel, streamName } from '@shared/domain/log-line';

@Component({
  selector: 'app-logs-page',
  imports: [FormsModule, DatePipe, PageHeader, TimeRange, TimeSeriesChart],
  templateUrl: './logs-page.html',
  styleUrl: './logs-page.scss',
})
export class LogsPage {
  protected readonly store = inject(LogsStore);
  protected readonly label = signal('');
  protected readonly levels: LogLevel[] = ['error', 'warn', 'info', 'debug', 'unknown'];
  protected readonly streamName = streamName;

  constructor() {
    void this.store.loadLabels();
    if (this.store.lines().length === 0) void this.store.run();

    let first = true;
    effect(() => {
      this.store.range();
      this.store.limit();
      if (first) {
        first = false;
        return;
      }
      void this.store.run();
    });
  }

  protected pickLabel(label: string): void {
    this.label.set(label);
    void this.store.loadLabelValues(label);
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void this.store.run();
    }
  }

  protected labelPairs(labels: Record<string, string>): [string, string][] {
    return Object.entries(labels).sort(([a], [b]) => a.localeCompare(b));
  }

  protected toggle(id: string): void {
    this.store.expanded.update((current) => (current === id ? null : id));
  }
}
