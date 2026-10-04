import { Injectable, inject } from '@angular/core';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import PROMETHEUS from './prometheus.json';

const TIMEOUT_MS = 4000;

interface QueryResponse {
  status: string;
  data?: { result?: { value?: [number, string] }[] };
}

@Injectable({ providedIn: 'root' })
export class PrometheusQueryService {
  private readonly server = inject(HomelabServer);

  async value(expression: string): Promise<number | null> {
    const url = this.server.url(
      PROMETHEUS,
      `/api/v1/query?query=${encodeURIComponent(expression)}`,
    );
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) throw new Error(`Prometheus answered ${response.status}`);
    const body = (await response.json()) as QueryResponse;
    const sample = body.data?.result?.[0]?.value?.[1];
    return sample === undefined ? null : Number(sample);
  }
}
