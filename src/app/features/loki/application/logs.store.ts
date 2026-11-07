import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { seriesName } from '@shared/infrastructure/prometheus-query.service';
import type { ChartSeries } from '@shared/ui/charts/time-series-chart';
import { type TimeRangeId, timeWindow } from '@shared/ui/time-range/time-range';
import type { LogLevel, LogLine } from '@shared/domain/log-line';
import { LokiQueryService } from '@shared/infrastructure/loki-query.service';

const LIVE_INTERVAL_MS = 5000;
const LEVEL_COLORS: Record<string, string> = {
  error: 'var(--danger)',
  warn: 'var(--warning)',
  info: 'var(--chart-1)',
  debug: 'var(--text-muted)',
};

@Injectable({ providedIn: 'root' })
export class LogsStore {
  private readonly api = inject(LokiQueryService);

  readonly query = signal('{service_name=~".+"}');
  readonly range = signal<TimeRangeId>('1h');
  readonly limit = signal(500);
  readonly lines = signal<LogLine[]>([]);
  readonly volume = signal<ChartSeries[]>([]);
  readonly metricSeries = signal<ChartSeries[] | null>(null);
  readonly running = signal(false);
  readonly error = signal<string | null>(null);
  readonly live = signal(false);
  readonly levelFilter = signal<ReadonlySet<LogLevel>>(new Set());
  readonly labels = signal<string[]>([]);
  readonly labelValues = signal<string[]>([]);
  readonly expanded = signal<string | null>(null);

  readonly shown = computed(() => {
    const filter = this.levelFilter();
    if (filter.size === 0) return this.lines();
    return this.lines().filter((line) => filter.has(line.level));
  });

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stopLive());
  }

  async run(): Promise<void> {
    const query = this.query().trim();
    if (!query || this.running()) return;
    this.running.set(true);
    this.error.set(null);
    const window = timeWindow(this.range(), Date.now(), 120);
    try {
      const result = await this.api.queryRange(query, window.startSec, window.endSec, {
        limit: this.limit(),
        stepSec: window.stepSec,
      });
      if (result.kind === 'series') {
        this.metricSeries.set(
          result.series.map((entry) => ({ name: seriesName(entry.labels), points: entry.points })),
        );
        this.lines.set([]);
        this.volume.set([]);
      } else {
        this.metricSeries.set(null);
        this.lines.set(result.lines);
        void this.loadVolume(query, window.startSec, window.endSec, window.stepSec);
      }
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.running.set(false);
    }
  }

  private async loadVolume(query: string, startSec: number, endSec: number, stepSec: number) {
    try {
      const result = await this.api.queryRange(
        `sum by (detected_level) (count_over_time(${query} [${stepSec}s]))`,
        startSec,
        endSec,
        { stepSec },
      );
      if (result.kind !== 'series') return;
      this.volume.set(
        result.series.map((entry) => {
          const level = entry.labels['detected_level'] ?? 'unknown';
          return { name: level, points: entry.points, color: LEVEL_COLORS[level] };
        }),
      );
    } catch {
      this.volume.set([]);
    }
  }

  async loadLabels(): Promise<void> {
    const window = timeWindow('6h');
    try {
      this.labels.set(await this.api.labels(window.startSec, window.endSec));
    } catch {
      this.labels.set([]);
    }
  }

  async loadLabelValues(label: string): Promise<void> {
    const window = timeWindow('6h');
    this.labelValues.set([]);
    if (!label) return;
    try {
      this.labelValues.set(await this.api.labelValues(label, window.startSec, window.endSec));
    } catch {
      this.labelValues.set([]);
    }
  }

  useSelector(label: string, value: string): void {
    this.query.set(`{${label}="${value.replace(/"/g, '\\"')}"}`);
    void this.run();
  }

  toggleLevel(level: LogLevel): void {
    this.levelFilter.update((current) => {
      const next = new Set(current);
      if (next.has(level)) next.delete(level);
      else next.add(level);
      return next;
    });
  }

  toggleLive(): void {
    if (this.live()) this.stopLive();
    else {
      this.live.set(true);
      void this.run();
      this.timer = setInterval(() => void this.run(), LIVE_INTERVAL_MS);
    }
  }

  stopLive(): void {
    this.live.set(false);
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }
}
