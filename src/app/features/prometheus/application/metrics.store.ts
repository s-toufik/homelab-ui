import { Injectable, computed, inject, signal } from '@angular/core';
import {
  PrometheusQueryService,
  type Sample,
  seriesName,
} from '@shared/infrastructure/prometheus-query.service';
import type { ChartSeries } from '@shared/ui/charts/time-series-chart';
import { type TimeRangeId, timeWindow } from '@shared/ui/time-range/time-range';
import type { RulesOverview, ScrapeTarget } from '../domain/prometheus';
import { PrometheusApiService } from '../infrastructure/api/prometheus-api.service';

export type MetricsTab = 'query' | 'targets' | 'alerts';

const MAX_SERIES = 40;

@Injectable({ providedIn: 'root' })
export class MetricsStore {
  private readonly prometheus = inject(PrometheusQueryService);
  private readonly api = inject(PrometheusApiService);

  readonly tab = signal<MetricsTab>('query');
  readonly query = signal('sum by (job) (up)');
  readonly range = signal<TimeRangeId>('1h');
  readonly view = signal<'graph' | 'table'>('graph');
  readonly series = signal<ChartSeries[]>([]);
  readonly samples = signal<Sample[]>([]);
  readonly truncated = signal(0);
  readonly running = signal(false);
  readonly queryError = signal<string | null>(null);
  readonly metricNames = signal<string[]>([]);

  readonly targets = signal<ScrapeTarget[]>([]);
  readonly targetsError = signal<string | null>(null);
  readonly rules = signal<RulesOverview>({ alerts: [], recordings: [] });
  readonly rulesError = signal<string | null>(null);

  readonly targetSummary = computed(() => {
    const targets = this.targets();
    return { up: targets.filter((t) => t.health === 'up').length, total: targets.length };
  });
  readonly firing = computed(() => this.rules().alerts.filter((a) => a.state === 'firing'));

  async run(): Promise<void> {
    const expression = this.query().trim();
    if (!expression || this.running()) return;
    this.running.set(true);
    this.queryError.set(null);
    try {
      const window = timeWindow(this.range());
      const [series, samples] = await Promise.all([
        this.prometheus.range(expression, window.startSec, window.endSec, window.stepSec),
        this.prometheus.vector(expression),
      ]);
      this.truncated.set(Math.max(series.length - MAX_SERIES, 0));
      this.series.set(
        series.slice(0, MAX_SERIES).map((entry) => ({
          name: seriesName(entry.labels),
          points: entry.points,
        })),
      );
      this.samples.set(samples.sort((a, b) => b.value - a.value));
    } catch (error) {
      this.queryError.set((error as Error).message);
      this.series.set([]);
      this.samples.set([]);
    } finally {
      this.running.set(false);
    }
  }

  async loadMetricNames(): Promise<void> {
    if (this.metricNames().length) return;
    try {
      this.metricNames.set(await this.api.metricNames());
    } catch {
      this.metricNames.set([]);
    }
  }

  async loadTargets(): Promise<void> {
    try {
      this.targets.set(await this.api.targets());
      this.targetsError.set(null);
    } catch (error) {
      this.targetsError.set((error as Error).message);
    }
  }

  async loadRules(): Promise<void> {
    try {
      this.rules.set(await this.api.rules());
      this.rulesError.set(null);
    } catch (error) {
      this.rulesError.set((error as Error).message);
    }
  }

  explore(expression: string): void {
    this.query.set(expression);
    this.tab.set('query');
    void this.run();
  }
}
