import { Injectable, inject } from '@angular/core';
import { API_ROUTING } from '@shared/infrastructure/homelab-server';
import { PrometheusQueryService } from '@shared/infrastructure/prometheus-query.service';
import type { ServiceCheck, ServiceState } from '../domain/stack-service';

const TIMEOUT_MS = 5000;

@Injectable({ providedIn: 'root' })
export class StackHealthService {
  private readonly routing = inject(API_ROUTING);
  private readonly prometheus = inject(PrometheusQueryService);

  check(check: ServiceCheck): Promise<ServiceState> {
    return check.kind === 'health' ? this.health(check.key) : this.metric(check.query);
  }

  private async health(key: string): Promise<ServiceState> {
    if (this.routing !== 'gateway') return 'unknown';
    try {
      const response = await fetch(`/api/health/${key}`, {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return response.ok ? 'ready' : 'not-ready';
    } catch {
      return 'not-ready';
    }
  }

  private async metric(query: string): Promise<ServiceState> {
    try {
      const value = await this.prometheus.value(query);
      if (value === null) return 'unknown';
      return value >= 1 ? 'ready' : 'not-ready';
    } catch {
      return 'unknown';
    }
  }
}
