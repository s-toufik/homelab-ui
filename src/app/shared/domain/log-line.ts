export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'unknown';

export interface LogLine {
  id: string;
  timeMs: number;
  labels: Record<string, string>;
  line: string;
  level: LogLevel;
}

const LEVEL_LABELS = ['level', 'detected_level', 'severity', 'severity_text', 'lvl'];

export function detectLevel(labels: Record<string, string>, line: string): LogLevel {
  for (const key of LEVEL_LABELS) {
    const value = labels[key];
    if (value) return normalizeLevel(value);
  }
  const match = /\b(level|lvl|severity)["'=:\s]+["']?(\w+)/i.exec(line);
  if (match) return normalizeLevel(match[2]);
  if (/\b(ERROR|FATAL|PANIC|CRITICAL|Traceback)\b/.test(line)) return 'error';
  if (/\bWARN(ING)?\b/.test(line)) return 'warn';
  if (/\bINFO\b/.test(line)) return 'info';
  if (/\b(DEBUG|TRACE)\b/.test(line)) return 'debug';
  return 'unknown';
}

export function normalizeLevel(value: string): LogLevel {
  const lower = value.toLowerCase();
  if (/^(err|error|fatal|panic|crit|critical|alert|emerg)/.test(lower)) return 'error';
  if (/^warn/.test(lower)) return 'warn';
  if (/^(info|notice)/.test(lower)) return 'info';
  if (/^(debug|trace)/.test(lower)) return 'debug';
  return 'unknown';
}

const TRACE_ID_LABELS = ['trace_id', 'traceid', 'traceID', 'trace.id'];

export function traceIdOf(labels: Record<string, string>): string | null {
  for (const key of TRACE_ID_LABELS) {
    const value = labels[key];
    if (value && /^[0-9a-f]{16,32}$/i.test(value) && !/^0+$/.test(value)) return value;
  }
  return null;
}

export function streamName(labels: Record<string, string>): string {
  return labels['service_name'] ?? labels['container'] ?? labels['pod'] ?? labels['job'] ?? 'log';
}
