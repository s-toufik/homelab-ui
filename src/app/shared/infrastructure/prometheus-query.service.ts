import { Injectable, inject } from '@angular/core';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import { GatewayApi } from './gateway-api';
import PROMETHEUS from './prometheus.json';

const TIMEOUT_MS = 4000;

interface QueryResponse {
  status: string;
  data?: { result?: { value?: [number, string] }[] };
}

interface VectorResponse {
  data: {
    resultType: string;
    result: { metric: Record<string, string>; value: [number, string] }[];
  };
}

interface MatrixResponse {
  data: { result: { metric: Record<string, string>; values: [number, string][] }[] };
}

export interface Sample {
  labels: Record<string, string>;
  value: number;
}

export interface Series {
  labels: Record<string, string>;
  points: [number, number][];
}

@Injectable({ providedIn: 'root' })
export class PrometheusQueryService {
  private readonly server = inject(HomelabServer);
  private readonly api = inject(GatewayApi);

  url(path: string): string {
    return this.server.api(PROMETHEUS, path);
  }

  async value(expression: string): Promise<number | null> {
    const url = this.url(`/api/v1/query?query=${encodeURIComponent(expression)}`);
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) throw new Error(`Prometheus answered ${response.status}`);
    const body = (await response.json()) as QueryResponse;
    const sample = body.data?.result?.[0]?.value?.[1];
    return sample === undefined ? null : Number(sample);
  }

  async vector(expression: string): Promise<Sample[]> {
    const body = await this.api.json<VectorResponse>(
      this.url(`/api/v1/query?query=${encodeURIComponent(expression)}`),
    );
    if (body.data.resultType === 'scalar') {
      const [, value] = body.data.result as unknown as [number, string];
      return [{ labels: {}, value: Number(value) }];
    }
    return body.data.result.map((entry) => ({
      labels: entry.metric,
      value: Number(entry.value[1]),
    }));
  }

  async range(
    expression: string,
    startSec: number,
    endSec: number,
    stepSec: number,
  ): Promise<Series[]> {
    const params = new URLSearchParams({
      query: expression,
      start: String(startSec),
      end: String(endSec),
      step: String(stepSec),
    });
    const body = await this.api.json<MatrixResponse>(this.url(`/api/v1/query_range?${params}`));
    return body.data.result.map((entry) => ({
      labels: entry.metric,
      points: entry.values.map(([time, value]) => [time * 1000, Number(value)] as [number, number]),
    }));
  }
}

export function seriesName(labels: Record<string, string>, legend?: string): string {
  if (legend) return legend.replace(/\{\{\s*(\w+)\s*\}\}/g, (_, key: string) => labels[key] ?? '');
  const { __name__: name, ...rest } = labels;
  const pairs = Object.entries(rest).map(([key, value]) => `${key}="${value}"`);
  if (pairs.length === 0) return name ?? 'value';
  return `${name ?? ''}{${pairs.join(', ')}}`;
}
