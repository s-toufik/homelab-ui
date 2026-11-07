import { Injectable, inject } from '@angular/core';
import { GatewayApi } from '@shared/infrastructure/gateway-api';
import { PrometheusQueryService } from '@shared/infrastructure/prometheus-query.service';
import type {
  AlertRule,
  AlertState,
  RecordingRule,
  RulesOverview,
  ScrapeTarget,
  TargetHealth,
} from '../../domain/prometheus';

interface TargetsResponse {
  data: {
    activeTargets: {
      labels: Record<string, string>;
      scrapePool: string;
      scrapeUrl: string;
      health: string;
      lastError: string;
      lastScrape: string;
      lastScrapeDuration: number;
    }[];
  };
}

interface RuleResponse {
  type: 'alerting' | 'recording';
  name: string;
  query: string;
  health: string;
  state?: string;
  annotations?: Record<string, string>;
  alerts?: { state: string; activeAt?: string }[];
}

interface RulesResponse {
  data: { groups: { name: string; rules: RuleResponse[] }[] };
}

interface LabelValuesResponse {
  data: string[];
}

export function toTargets(body: TargetsResponse): ScrapeTarget[] {
  return body.data.activeTargets
    .map((target) => ({
      job: target.labels['job'] ?? target.scrapePool,
      instance: target.labels['instance'] ?? target.scrapeUrl,
      url: target.scrapeUrl,
      health: (['up', 'down'].includes(target.health) ? target.health : 'unknown') as TargetHealth,
      lastError: target.lastError,
      lastScrape: target.lastScrape,
      durationSeconds: target.lastScrapeDuration,
    }))
    .sort((a, b) => a.job.localeCompare(b.job) || a.instance.localeCompare(b.instance));
}

export function toRules(body: RulesResponse): RulesOverview {
  const alerts: AlertRule[] = [];
  const recordings: RecordingRule[] = [];
  for (const group of body.data.groups) {
    for (const rule of group.rules) {
      if (rule.type === 'alerting') {
        const active = rule.alerts ?? [];
        const since = active
          .map((alert) => alert.activeAt)
          .filter((at): at is string => !!at)
          .sort()[0];
        alerts.push({
          group: group.name,
          name: rule.name,
          query: rule.query,
          state: (rule.state ?? 'inactive') as AlertState,
          health: rule.health,
          summary: rule.annotations?.['summary'] ?? rule.annotations?.['description'] ?? '',
          activeSince: since ?? null,
          firing: active.filter((alert) => alert.state === 'firing').length,
        });
      } else {
        recordings.push({
          group: group.name,
          name: rule.name,
          query: rule.query,
          health: rule.health,
        });
      }
    }
  }
  const order: Record<AlertState, number> = { firing: 0, pending: 1, inactive: 2 };
  alerts.sort((a, b) => order[a.state] - order[b.state] || a.name.localeCompare(b.name));
  return { alerts, recordings };
}

@Injectable({ providedIn: 'root' })
export class PrometheusApiService {
  private readonly api = inject(GatewayApi);
  private readonly prometheus = inject(PrometheusQueryService);

  async targets(): Promise<ScrapeTarget[]> {
    return toTargets(await this.api.json<TargetsResponse>(this.prometheus.url('/api/v1/targets')));
  }

  async rules(): Promise<RulesOverview> {
    return toRules(await this.api.json<RulesResponse>(this.prometheus.url('/api/v1/rules')));
  }

  async metricNames(): Promise<string[]> {
    const body = await this.api.json<LabelValuesResponse>(
      this.prometheus.url('/api/v1/label/__name__/values'),
    );
    return body.data;
  }
}
