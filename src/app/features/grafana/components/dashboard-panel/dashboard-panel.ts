import { DatePipe } from '@angular/common';
import { Component, effect, inject, input, signal } from '@angular/core';
import { type LogLine, streamName } from '@shared/domain/log-line';
import { LokiQueryService } from '@shared/infrastructure/loki-query.service';
import {
  PrometheusQueryService,
  seriesName,
} from '@shared/infrastructure/prometheus-query.service';
import { formatValue } from '@shared/ui/charts/chart-format';
import { Gauge } from '@shared/ui/charts/gauge';
import { type ChartSeries, TimeSeriesChart } from '@shared/ui/charts/time-series-chart';
import type { TimeWindow } from '@shared/ui/time-range/time-range';
import { type Panel, withRateInterval } from '../../domain/dashboards';

interface Reading {
  name: string;
  value: number;
}

@Component({
  selector: 'app-dashboard-panel',
  imports: [DatePipe, Gauge, TimeSeriesChart],
  templateUrl: './dashboard-panel.html',
  styleUrl: './dashboard-panel.scss',
})
export class DashboardPanel {
  readonly panel = input.required<Panel>();
  readonly window = input.required<TimeWindow>();

  private readonly prometheus = inject(PrometheusQueryService);
  private readonly loki = inject(LokiQueryService);

  protected readonly series = signal<ChartSeries[]>([]);
  protected readonly readings = signal<Reading[]>([]);
  protected readonly lines = signal<LogLine[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly format = formatValue;
  protected readonly streamName = streamName;

  constructor() {
    effect(() => void this.load(this.panel(), this.window()));
  }

  protected barPercent(reading: Reading): number {
    const max = this.panel().max ?? Math.max(...this.readings().map((r) => r.value), 1);
    return Math.min(Math.max((reading.value / max) * 100, 0), 100);
  }

  private async load(panel: Panel, window: TimeWindow): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      if (panel.kind === 'logs') {
        const result = await this.loki.queryRange(
          panel.queries[0].expr,
          window.startSec,
          window.endSec,
          {
            limit: 100,
          },
        );
        this.lines.set(result.kind === 'lines' ? result.lines : []);
      } else if (panel.kind === 'timeseries') {
        const all = await Promise.all(
          panel.queries.map((query) => this.range(query.expr, query.source, window)),
        );
        this.series.set(
          all.flatMap((list, index) =>
            list.map((entry) => ({
              name: seriesName(entry.labels, panel.queries[index].legend),
              points: entry.points,
            })),
          ),
        );
      } else {
        const all = await Promise.all(
          panel.queries.map((query) =>
            this.prometheus.vector(withRateInterval(query.expr, window.stepSec)),
          ),
        );
        this.readings.set(
          all.flatMap((samples, index) =>
            samples.map((sample) => ({
              name: seriesName(sample.labels, panel.queries[index].legend),
              value: sample.value,
            })),
          ),
        );
      }
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  private async range(expr: string, source: 'prometheus' | 'loki' | undefined, window: TimeWindow) {
    const query = withRateInterval(expr, window.stepSec);
    if (source === 'loki') {
      const result = await this.loki.queryRange(query, window.startSec, window.endSec, {
        stepSec: window.stepSec,
      });
      return result.kind === 'series' ? result.series : [];
    }
    return this.prometheus.range(query, window.startSec, window.endSec, window.stepSec);
  }
}
