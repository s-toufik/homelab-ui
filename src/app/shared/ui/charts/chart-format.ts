export type ChartUnit =
  'number' | 'percent' | 'ratio' | 'bytes' | 'bytesPerSecond' | 'seconds' | 'perSecond' | 'celsius';

export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
  'var(--chart-6)',
  'var(--chart-7)',
  'var(--chart-8)',
] as const;

export function chartColor(index: number): string {
  return CHART_COLORS[index % CHART_COLORS.length];
}

const BYTE_UNITS = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];

function compact(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude >= 1e9) return `${trim(value / 1e9)}G`;
  if (magnitude >= 1e6) return `${trim(value / 1e6)}M`;
  if (magnitude >= 1e3) return `${trim(value / 1e3)}k`;
  return trim(value);
}

function trim(value: number): string {
  const magnitude = Math.abs(value);
  const digits = magnitude >= 100 ? 0 : magnitude >= 10 ? 1 : magnitude >= 1 ? 2 : 3;
  return Number(value.toFixed(digits)).toString();
}

export function formatBytes(value: number): string {
  let scaled = value;
  let unit = 0;
  while (Math.abs(scaled) >= 1024 && unit < BYTE_UNITS.length - 1) {
    scaled /= 1024;
    unit++;
  }
  return `${trim(scaled)} ${BYTE_UNITS[unit]}`;
}

export function formatSeconds(value: number): string {
  const magnitude = Math.abs(value);
  if (magnitude === 0) return '0 s';
  if (magnitude < 1e-3) return `${trim(value * 1e6)} µs`;
  if (magnitude < 1) return `${trim(value * 1e3)} ms`;
  if (magnitude < 120) return `${trim(value)} s`;
  if (magnitude < 7200) return `${trim(value / 60)} min`;
  if (magnitude < 172_800) return `${trim(value / 3600)} h`;
  return `${trim(value / 86_400)} d`;
}

export function formatValue(value: number | null | undefined, unit: ChartUnit = 'number'): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '–';
  switch (unit) {
    case 'percent':
      return `${trim(value)}%`;
    case 'ratio':
      return `${trim(value * 100)}%`;
    case 'bytes':
      return formatBytes(value);
    case 'bytesPerSecond':
      return `${formatBytes(value)}/s`;
    case 'seconds':
      return formatSeconds(value);
    case 'perSecond':
      return `${compact(value)}/s`;
    case 'celsius':
      return `${trim(value)} °C`;
    default:
      return compact(value);
  }
}

export function formatTime(ms: number, spanMs: number): string {
  const date = new Date(ms);
  const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (spanMs <= 36 * 3600_000) return time;
  return `${date.toLocaleDateString([], { day: '2-digit', month: 'short' })} ${time}`;
}

export function niceTicks(min: number, max: number, count = 4): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max)) return [0];
  if (min === max) return [min];
  const raw = (max - min) / count;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw) ?? raw;
  const ticks: number[] = [];
  for (let tick = Math.ceil(min / step) * step; tick <= max + step * 1e-9; tick += step) {
    ticks.push(Number(tick.toPrecision(12)));
  }
  return ticks;
}
