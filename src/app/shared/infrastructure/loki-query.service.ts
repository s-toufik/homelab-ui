import { Injectable, inject } from '@angular/core';
import { GatewayApi } from '@shared/infrastructure/gateway-api';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import type { Series } from './prometheus-query.service';
import { type LogLine, detectLevel } from '../domain/log-line';
import LOKI from './loki.json';

interface StreamsResult {
  resultType: 'streams';
  result: { stream: Record<string, string>; values: [string, string][] }[];
}

interface MatrixResult {
  resultType: 'matrix';
  result: { metric: Record<string, string>; values: [number, string][] }[];
}

interface QueryResponse {
  data: StreamsResult | MatrixResult;
}

interface LabelsResponse {
  data?: string[];
}

export type LokiResult = { kind: 'lines'; lines: LogLine[] } | { kind: 'series'; series: Series[] };

export function toResult(body: QueryResponse): LokiResult {
  if (body.data.resultType === 'matrix') {
    return {
      kind: 'series',
      series: body.data.result.map((entry) => ({
        labels: entry.metric,
        points: entry.values.map(
          ([time, value]) => [time * 1000, Number(value)] as [number, number],
        ),
      })),
    };
  }
  const lines: LogLine[] = [];
  for (const stream of body.data.result) {
    for (const [nanos, line] of stream.values) {
      lines.push({
        id: `${nanos}-${lines.length}`,
        timeMs: Number(BigInt(nanos) / 1_000_000n),
        labels: stream.stream,
        line,
        level: detectLevel(stream.stream, line),
      });
    }
  }
  lines.sort((a, b) => b.timeMs - a.timeMs);
  return { kind: 'lines', lines };
}

@Injectable({ providedIn: 'root' })
export class LokiQueryService {
  private readonly api = inject(GatewayApi);
  private readonly server = inject(HomelabServer);

  private url(path: string): string {
    return this.server.api(LOKI, `/loki/api/v1${path}`);
  }

  async labels(startSec: number, endSec: number): Promise<string[]> {
    const params = new URLSearchParams({ start: `${startSec}`, end: `${endSec}` });
    const body = await this.api.json<LabelsResponse>(this.url(`/labels?${params}`));
    return (body.data ?? []).filter((label) => !label.startsWith('__')).sort();
  }

  async labelValues(label: string, startSec: number, endSec: number): Promise<string[]> {
    const params = new URLSearchParams({ start: `${startSec}`, end: `${endSec}` });
    const body = await this.api.json<LabelsResponse>(
      this.url(`/label/${encodeURIComponent(label)}/values?${params}`),
    );
    return (body.data ?? []).sort();
  }

  async queryRange(
    query: string,
    startSec: number,
    endSec: number,
    options: { limit?: number; stepSec?: number } = {},
  ): Promise<LokiResult> {
    const params = new URLSearchParams({
      query,
      start: `${startSec}000000000`,
      end: `${endSec}000000000`,
      direction: 'backward',
      limit: `${options.limit ?? 500}`,
    });
    if (options.stepSec) params.set('step', `${options.stepSec}`);
    return toResult(await this.api.json<QueryResponse>(this.url(`/query_range?${params}`)));
  }
}
