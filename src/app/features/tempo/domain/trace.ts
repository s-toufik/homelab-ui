export interface TraceSummary {
  traceId: string;
  service: string;
  name: string;
  startMs: number;
  durationMs: number;
}

export interface Span {
  spanId: string;
  parentId: string | null;
  service: string;
  name: string;
  kind: string;
  startMs: number;
  durationMs: number;
  error: boolean;
  statusMessage: string;
  attributes: [string, string][];
}

export interface WaterfallRow {
  span: Span;
  depth: number;
  offsetPercent: number;
  widthPercent: number;
}

export function waterfall(spans: readonly Span[]): {
  rows: WaterfallRow[];
  startMs: number;
  durationMs: number;
} {
  if (spans.length === 0) return { rows: [], startMs: 0, durationMs: 0 };
  const startMs = Math.min(...spans.map((s) => s.startMs));
  const endMs = Math.max(...spans.map((s) => s.startMs + s.durationMs));
  const durationMs = Math.max(endMs - startMs, 0.001);
  const ids = new Set(spans.map((s) => s.spanId));
  const children = new Map<string | null, Span[]>();
  for (const span of spans) {
    const parent = span.parentId && ids.has(span.parentId) ? span.parentId : null;
    const list = children.get(parent) ?? [];
    list.push(span);
    children.set(parent, list);
  }
  for (const list of children.values()) list.sort((a, b) => a.startMs - b.startMs);

  const rows: WaterfallRow[] = [];
  const visit = (parent: string | null, depth: number) => {
    for (const span of children.get(parent) ?? []) {
      rows.push({
        span,
        depth,
        offsetPercent: ((span.startMs - startMs) / durationMs) * 100,
        widthPercent: Math.max((span.durationMs / durationMs) * 100, 0.3),
      });
      visit(span.spanId, depth + 1);
    }
  };
  visit(null, 0);
  return { rows, startMs, durationMs };
}
