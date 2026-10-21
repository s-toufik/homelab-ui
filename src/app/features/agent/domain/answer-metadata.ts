export type AnswerMetadata = Readonly<Record<string, string>>;

export interface MetadataEntry {
  key: string;
  label: string;
  value: string;
}

export const ELAPSED_TIME = 'elapsed_time';
export const INPUT_TOKENS = 'input_tokens';
export const OUTPUT_TOKENS = 'output_tokens';

export function answerMetadata(raw: Record<string, unknown> | undefined): AnswerMetadata {
  const metadata: Record<string, string> = {};
  for (const [key, value] of Object.entries(raw ?? {})) {
    if (value === null || value === undefined) continue;
    const text = typeof value === 'object' ? JSON.stringify(value) : String(value);
    if (text.trim() !== '') metadata[key] = text;
  }
  return metadata;
}

export function metadataEntries(metadata: AnswerMetadata | undefined): MetadataEntry[] {
  return Object.entries(metadata ?? {}).map(([key, value]) => ({
    key,
    label: labelOf(key),
    value,
  }));
}

export function usageSummary(metadata: AnswerMetadata | undefined): string | null {
  if (!metadata) return null;
  const parts: string[] = [];
  const elapsed = metadata[ELAPSED_TIME];
  const input = tokenCount(metadata[INPUT_TOKENS]);
  const output = tokenCount(metadata[OUTPUT_TOKENS]);
  if (elapsed) parts.push(elapsed);
  if (input !== null) parts.push(`↑ ${compactNumber(input)}`);
  if (output !== null) parts.push(`↓ ${compactNumber(output)}`);
  if (parts.length === 0) return null;
  const tokens = input !== null || output !== null ? ' tokens' : '';
  return `(${parts.join(' · ')}${tokens})`;
}

export function compactNumber(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${trimmed(value / 1000)}k`;
  return `${trimmed(value / 1_000_000)}M`;
}

function tokenCount(value: string | undefined): number | null {
  if (value === undefined) return null;
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? Math.round(count) : null;
}

function trimmed(value: number): string {
  return value.toFixed(1).replace(/\.0$/, '');
}

function labelOf(key: string): string {
  const words = key
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .trim();
  return words.charAt(0).toUpperCase() + words.slice(1).toLowerCase();
}
