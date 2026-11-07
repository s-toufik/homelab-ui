import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { seriesName } from '@shared/infrastructure/prometheus-query.service';
import { TimeSeriesChart } from '@shared/ui/charts/time-series-chart';
import { formatValue } from '@shared/ui/charts/chart-format';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { TimeRange } from '@shared/ui/time-range/time-range';
import { type MetricsTab, MetricsStore } from '../../application/metrics.store';

@Component({
  selector: 'app-metrics-page',
  imports: [FormsModule, DatePipe, DecimalPipe, PageHeader, TimeRange, TimeSeriesChart],
  templateUrl: './metrics-page.html',
  styleUrl: './metrics-page.scss',
})
export class MetricsPage {
  protected readonly store = inject(MetricsStore);
  protected readonly tabs: { id: MetricsTab; label: string }[] = [
    { id: 'query', label: 'Query' },
    { id: 'targets', label: 'Targets' },
    { id: 'alerts', label: 'Alerts and rules' },
  ];
  protected readonly seriesName = seriesName;
  protected readonly format = formatValue;

  constructor() {
    void this.store.loadMetricNames();
    void this.store.loadTargets();
    void this.store.loadRules();
    if (this.store.series().length === 0) void this.store.run();

    let firstRange = true;
    effect(() => {
      this.store.range();
      if (firstRange) {
        firstRange = false;
        return;
      }
      void this.store.run();
    });
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey || !event.shiftKey)) {
      event.preventDefault();
      void this.store.run();
    }
  }

  protected labelPairs(labels: Record<string, string>): [string, string][] {
    return Object.entries(labels).filter(([key]) => key !== '__name__');
  }
}
