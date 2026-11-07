import { Injectable, inject } from '@angular/core';
import { GatewayApi } from '@shared/infrastructure/gateway-api';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import type { Span, TraceSummary } from '../../domain/trace';
import TEMPO from '../tempo.json';

interface SearchResponse {
  traces?: {
    traceID: string;
    rootServiceName?: string;
    rootTraceName?: string;
    startTimeUnixNano: string;
    durationMs?: number;
  }[];
}

interface TagValuesResponse {
  tagValues?: { value: string }[];
}

interface OtlpValue {
  stringValue?: string;
  intValue?: string | number;
  doubleValue?: number;
  boolValue?: boolean;
  arrayValue?: { values?: OtlpValue[] };
}

interface OtlpAttribute {
  key: string;
  value: OtlpValue;
}

interface OtlpSpan {
  spanId: string;
  parentSpanId?: string;
  name: string;
  kind?: string | number;
  startTimeUnixNano: string;
  endTimeUnixNano: string;
  attributes?: OtlpAttribute[];
  status?: { code?: string | number; message?: string };
}

interface OtlpResourceSpans {
  resource?: { attributes?: OtlpAttribute[] };
  scopeSpans?: { spans?: OtlpSpan[] }[];
  instrumentationLibrarySpans?: { spans?: OtlpSpan[] }[];
}

interface TraceResponse {
  batches?: OtlpResourceSpans[];
  resourceSpans?: OtlpResourceSpans[];
  trace?: { resourceSpans?: OtlpResourceSpans[] };
}

export interface TraceSearch {
  service?: string;
  name?: string;
  minDurationMs?: number;
  traceql?: string;
  startSec: number;
  endSec: number;
  limit?: number;
}

function valueText(value: OtlpValue): string {
  if (value.stringValue !== undefined) return value.stringValue;
  if (value.intValue !== undefined) return String(value.intValue);
  if (value.doubleValue !== undefined) return String(value.doubleValue);
  if (value.boolValue !== undefined) return String(value.boolValue);
  if (value.arrayValue) return `[${(value.arrayValue.values ?? []).map(valueText).join(', ')}]`;
  return '';
}

const nanosToMs = (nanos: string) => Number(BigInt(nanos) / 1000n) / 1000;

export function toSummaries(body: SearchResponse): TraceSummary[] {
  return (body.traces ?? [])
    .map((trace) => ({
      traceId: trace.traceID,
      service: trace.rootServiceName ?? '?',
      name: trace.rootTraceName ?? '',
      startMs: nanosToMs(trace.startTimeUnixNano),
      durationMs: trace.durationMs ?? 0,
    }))
    .sort((a, b) => b.startMs - a.startMs);
}

export function toSpans(body: TraceResponse): Span[] {
  const batches = body.batches ?? body.resourceSpans ?? body.trace?.resourceSpans ?? [];
  const spans: Span[] = [];
  for (const batch of batches) {
    const service =
      batch.resource?.attributes?.find((a) => a.key === 'service.name')?.value.stringValue ?? '?';
    for (const scope of batch.scopeSpans ?? batch.instrumentationLibrarySpans ?? []) {
      for (const span of scope.spans ?? []) {
        const startMs = nanosToMs(span.startTimeUnixNano);
        const code = span.status?.code;
        spans.push({
          spanId: span.spanId,
          parentId: span.parentSpanId || null,
          service,
          name: span.name,
          kind: String(span.kind ?? '')
            .replace('SPAN_KIND_', '')
            .toLowerCase(),
          startMs,
          durationMs: nanosToMs(span.endTimeUnixNano) - startMs,
          error: code === 2 || code === 'STATUS_CODE_ERROR',
          statusMessage: span.status?.message ?? '',
          attributes: (span.attributes ?? []).map((a) => [a.key, valueText(a.value)]),
        });
      }
    }
  }
  return spans;
}

@Injectable({ providedIn: 'root' })
export class TempoApiService {
  private readonly api = inject(GatewayApi);
  private readonly server = inject(HomelabServer);

  private url(path: string): string {
    return this.server.api(TEMPO, path);
  }

  async services(): Promise<string[]> {
    const body = await this.api.json<TagValuesResponse>(
      this.url('/api/v2/search/tag/resource.service.name/values'),
    );
    return (body.tagValues ?? []).map((tag) => tag.value).sort();
  }

  async search(search: TraceSearch): Promise<TraceSummary[]> {
    const params = new URLSearchParams({
      start: `${search.startSec}`,
      end: `${search.endSec}`,
      limit: `${search.limit ?? 50}`,
    });
    if (search.traceql?.trim()) {
      params.set('q', search.traceql.trim());
    } else {
      const conditions: string[] = [];
      if (search.service) conditions.push(`resource.service.name="${search.service}"`);
      if (search.name) conditions.push(`name=~".*${search.name.replace(/"/g, '\\"')}.*"`);
      if (search.minDurationMs) conditions.push(`duration>${search.minDurationMs}ms`);
      params.set('q', `{${conditions.join(' && ')}}`);
    }
    return toSummaries(await this.api.json<SearchResponse>(this.url(`/api/search?${params}`)));
  }

  async trace(traceId: string): Promise<Span[]> {
    return toSpans(
      await this.api.json<TraceResponse>(this.url(`/api/traces/${encodeURIComponent(traceId)}`)),
    );
  }
}
