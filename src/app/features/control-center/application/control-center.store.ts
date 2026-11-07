import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import type { LogLine } from '@shared/domain/log-line';
import { GatewayApi } from '@shared/infrastructure/gateway-api';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import { LokiQueryService } from '@shared/infrastructure/loki-query.service';
import {
  PrometheusQueryService,
  type Sample,
} from '@shared/infrastructure/prometheus-query.service';
import { timeWindow } from '@shared/ui/time-range/time-range';
import KUBE from '../infrastructure/kube.json';
import LLM from '../infrastructure/llm.json';
import {
  FIRING_ALERTS,
  GAUGES,
  RECENT_ERRORS,
  STATS,
  TOP_CPU,
  TOP_MEMORY,
} from '../infrastructure/signals';

type GaugeKey = keyof typeof GAUGES;
type StatKey = keyof typeof STATS;

export interface KubeSummary {
  pods: number;
  notReady: { namespace: string; name: string; reason: string }[];
  restartsLastHour: number;
  warningsLastHour: number;
  backups: { name: string; lastSuccessMs: number | null }[];
}

const REFRESH_MS = 30_000;

@Injectable({ providedIn: 'root' })
export class ControlCenterStore {
  private readonly prometheus = inject(PrometheusQueryService);
  private readonly loki = inject(LokiQueryService);
  private readonly api = inject(GatewayApi);
  private readonly server = inject(HomelabServer);
  private readonly session = inject(GatewaySession);

  readonly gauges = signal<Partial<Record<GaugeKey, number | null>>>({});
  readonly history = signal<Partial<Record<GaugeKey, [number, number][]>>>({});
  readonly stats = signal<Partial<Record<StatKey, number | null>>>({});
  readonly alerts = signal<Sample[]>([]);
  readonly topMemory = signal<Sample[]>([]);
  readonly topCpu = signal<Sample[]>([]);
  readonly errors = signal<LogLine[]>([]);
  readonly loadedModels = signal<string[]>([]);
  readonly kube = signal<KubeSummary | null>(null);
  readonly updatedAt = signal<Date | null>(null);
  readonly prometheusDown = signal(false);

  readonly allGood = computed(
    () =>
      !this.prometheusDown() &&
      this.updatedAt() !== null &&
      !this.warnings().length &&
      !this.alerts().length,
  );

  readonly warnings = computed(() => {
    const list: string[] = [];
    const gauges = this.gauges();
    if ((gauges.disk ?? 0) > 85) list.push(`Disk ${Math.round(gauges.disk!)}% full`);
    if ((gauges.memory ?? 0) > 90) list.push(`Memory ${Math.round(gauges.memory!)}% used`);
    if ((gauges.temperature ?? 0) > 85) list.push(`CPU at ${Math.round(gauges.temperature!)} °C`);
    if ((this.stats().targetsDown ?? 0) > 0)
      list.push(`${this.stats().targetsDown} scrape target(s) down`);
    const kube = this.kube();
    if (kube?.notReady.length) list.push(`${kube.notReady.length} pod(s) not ready`);
    for (const backup of kube?.backups ?? []) {
      if (!backup.lastSuccessMs || Date.now() - backup.lastSuccessMs > 26 * 3600_000)
        list.push(`${backup.name}: no backup in 26 h`);
    }
    return list;
  });

  private timer: ReturnType<typeof setInterval> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  start(): void {
    void this.refresh();
    this.timer ??= setInterval(() => void this.refresh(), REFRESH_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async refresh(): Promise<void> {
    await Promise.all([
      this.loadMetrics(),
      this.loadHistory(),
      this.loadErrors(),
      this.loadModels(),
      this.loadKube(),
    ]);
    this.updatedAt.set(new Date());
  }

  private async one(expression: string): Promise<number | null> {
    const samples = await this.prometheus.vector(expression);
    return samples[0]?.value ?? null;
  }

  private async loadMetrics(): Promise<void> {
    try {
      const gaugeKeys = Object.keys(GAUGES) as GaugeKey[];
      const statKeys = Object.keys(STATS) as StatKey[];
      const [gauges, stats, alerts, memory, cpu] = await Promise.all([
        Promise.all(gaugeKeys.map((key) => this.one(GAUGES[key]).catch(() => null))),
        Promise.all(statKeys.map((key) => this.one(STATS[key]).catch(() => null))),
        this.prometheus.vector(FIRING_ALERTS).catch(() => []),
        this.prometheus.vector(TOP_MEMORY).catch(() => []),
        this.prometheus.vector(TOP_CPU).catch(() => []),
      ]);
      this.gauges.set(Object.fromEntries(gaugeKeys.map((key, i) => [key, gauges[i]])));
      this.stats.set(Object.fromEntries(statKeys.map((key, i) => [key, stats[i]])));
      this.alerts.set(alerts);
      this.topMemory.set(memory.sort((a, b) => b.value - a.value));
      this.topCpu.set(cpu.sort((a, b) => b.value - a.value));
      this.prometheusDown.set(gauges.every((value) => value === null));
    } catch {
      this.prometheusDown.set(true);
    }
  }

  private async loadHistory(): Promise<void> {
    const window = timeWindow('24h', Date.now(), 96);
    const keys = Object.keys(GAUGES) as GaugeKey[];
    const series = await Promise.all(
      keys.map((key) =>
        this.prometheus
          .range(GAUGES[key], window.startSec, window.endSec, window.stepSec)
          .then((result) => result[0]?.points ?? [])
          .catch(() => [] as [number, number][]),
      ),
    );
    this.history.set(Object.fromEntries(keys.map((key, i) => [key, series[i]])));
  }

  private async loadErrors(): Promise<void> {
    const window = timeWindow('1h');
    try {
      const result = await this.loki.queryRange(RECENT_ERRORS, window.startSec, window.endSec, {
        limit: 8,
      });
      this.errors.set(result.kind === 'lines' ? result.lines : []);
    } catch {
      this.errors.set([]);
    }
  }

  private async loadModels(): Promise<void> {
    try {
      const body = await this.api.json<{ running?: { model: string }[] }>(
        this.server.api(LLM, '/running'),
      );
      this.loadedModels.set((body.running ?? []).map((entry) => entry.model));
    } catch {
      this.loadedModels.set([]);
    }
  }

  private async loadKube(): Promise<void> {
    if (!this.session.isAdmin()) {
      this.kube.set(null);
      return;
    }
    try {
      const url = (path: string) => this.server.api(KUBE, path);
      const [pods, events, cronJobs] = await Promise.all([
        this.api.json<{ items: any[] }>(url('/api/v1/pods')),
        this.api.json<{ items: any[] }>(url('/api/v1/events?fieldSelector=type%3DWarning')),
        this.api.json<{ items: any[] }>(url('/apis/batch/v1/namespaces/homelab/cronjobs')),
      ]);
      const hourAgo = Date.now() - 3600_000;
      const notReady = pods.items
        .filter((pod) => pod.status?.phase !== 'Succeeded')
        .filter(
          (pod) =>
            (pod.status?.containerStatuses ?? []).some((s: any) => !s.ready) ||
            pod.status?.phase !== 'Running',
        )
        .map((pod) => ({
          namespace: pod.metadata.namespace,
          name: pod.metadata.name,
          reason:
            (pod.status?.containerStatuses ?? []).find((s: any) => s.state?.waiting)?.state.waiting
              .reason ??
            pod.status?.phase ??
            'Unknown',
        }));
      const restartsLastHour = pods.items
        .flatMap((pod) => pod.status?.containerStatuses ?? [])
        .filter(
          (s: any) => Date.parse(s.lastState?.terminated?.finishedAt ?? '') >= hourAgo,
        ).length;
      const warningsLastHour = events.items.filter(
        (event) => Date.parse(event.lastTimestamp ?? event.eventTime ?? '') >= hourAgo,
      ).length;
      const backups = cronJobs.items
        .filter((job) => job.metadata.name.startsWith('backups-'))
        .map((job) => ({
          name: job.metadata.name,
          lastSuccessMs: Date.parse(job.status?.lastSuccessfulTime ?? '') || null,
        }));
      this.kube.set({
        pods: pods.items.length,
        notReady,
        restartsLastHour,
        warningsLastHour,
        backups,
      });
    } catch {
      this.kube.set(null);
    }
  }
}
