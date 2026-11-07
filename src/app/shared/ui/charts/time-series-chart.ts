import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { type ChartUnit, chartColor, formatTime, formatValue, niceTicks } from './chart-format';

export interface ChartSeries {
  name: string;
  points: readonly (readonly [number, number])[];
  color?: string;
}

interface DrawnSeries {
  name: string;
  color: string;
  line: string;
  area: string;
  points: readonly (readonly [number, number])[];
}

const PAD = { top: 8, right: 12, bottom: 22, left: 56 };

function nearest(points: readonly (readonly [number, number])[], time: number): number {
  let low = 0;
  let high = points.length - 1;
  while (low < high) {
    const mid = (low + high) >> 1;
    if (points[mid][0] < time) low = mid + 1;
    else high = mid;
  }
  if (low > 0 && time - points[low - 1][0] < points[low][0] - time) return low - 1;
  return low;
}

@Component({
  selector: 'app-time-series-chart',
  templateUrl: './time-series-chart.html',
  styleUrl: './time-series-chart.scss',
})
export class TimeSeriesChart {
  readonly series = input.required<readonly ChartSeries[]>();
  readonly unit = input<ChartUnit>('number');
  readonly height = input(220);
  readonly area = input(false);
  readonly min = input<number | null>(0);
  readonly max = input<number | null>(null);
  readonly legend = input(true);

  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly width = signal(600);
  protected readonly hidden = signal<ReadonlySet<string>>(new Set());
  protected readonly hoverX = signal<number | null>(null);

  protected readonly legendItems = computed(() =>
    this.series().map((entry, index) => ({
      name: entry.name,
      color: entry.color ?? chartColor(index),
    })),
  );

  protected readonly visible = computed(() =>
    this.series().filter((entry) => !this.hidden().has(entry.name)),
  );

  private readonly bounds = computed(() => {
    let xMin = Infinity;
    let xMax = -Infinity;
    let yMin = Infinity;
    let yMax = -Infinity;
    for (const entry of this.visible()) {
      for (const [time, value] of entry.points) {
        if (!Number.isFinite(value)) continue;
        xMin = Math.min(xMin, time);
        xMax = Math.max(xMax, time);
        yMin = Math.min(yMin, value);
        yMax = Math.max(yMax, value);
      }
    }
    if (!Number.isFinite(xMin)) return null;
    const floor = this.min() ?? yMin;
    const low = Math.min(floor, yMin);
    let high = this.max() ?? yMax;
    if (high === low) high = low + 1;
    const ticks = niceTicks(low, high);
    return {
      xMin,
      xMax: Math.max(xMax, xMin + 1),
      yMin: low,
      yMax: Math.max(high, ticks.at(-1) ?? high),
      ticks,
    };
  });

  protected readonly plot = computed(() => {
    const bounds = this.bounds();
    const width = this.width();
    const height = this.height();
    if (!bounds) return null;
    const innerWidth = Math.max(width - PAD.left - PAD.right, 10);
    const innerHeight = Math.max(height - PAD.top - PAD.bottom, 10);
    const x = (time: number) =>
      PAD.left + ((time - bounds.xMin) / (bounds.xMax - bounds.xMin)) * innerWidth;
    const y = (value: number) =>
      PAD.top + innerHeight - ((value - bounds.yMin) / (bounds.yMax - bounds.yMin)) * innerHeight;

    const drawn: DrawnSeries[] = this.series().map((entry, index) => {
      const color = entry.color ?? chartColor(index);
      if (this.hidden().has(entry.name))
        return { name: entry.name, color, line: '', area: '', points: [] };
      const gaps = gapThreshold(entry.points);
      let line = '';
      let area = '';
      let start: number | null = null;
      let last: number | null = null;
      let previousTime: number | null = null;
      for (const [time, value] of entry.points) {
        if (!Number.isFinite(value)) continue;
        const px = x(time).toFixed(1);
        const py = y(value).toFixed(1);
        const broken = previousTime !== null && time - previousTime > gaps;
        if (start === null || broken) {
          if (start !== null && last !== null)
            area += `L${last} ${y(bounds.yMin)}L${start} ${y(bounds.yMin)}Z`;
          line += `M${px} ${py}`;
          area += `M${px} ${y(bounds.yMin)}L${px} ${py}`;
          start = Number(px);
        } else {
          line += `L${px} ${py}`;
          area += `L${px} ${py}`;
        }
        last = Number(px);
        previousTime = time;
      }
      if (start !== null && last !== null)
        area += `L${last} ${y(bounds.yMin)}L${start} ${y(bounds.yMin)}Z`;
      return { name: entry.name, color, line, area, points: entry.points };
    });

    const span = bounds.xMax - bounds.xMin;
    const xTicks = Array.from({ length: 5 }, (_, i) => bounds.xMin + (span * i) / 4).map(
      (time) => ({
        x: x(time),
        label: formatTime(time, span),
      }),
    );
    const yTicks = bounds.ticks.map((value) => ({
      y: y(value),
      label: formatValue(value, this.unit()),
    }));

    return { drawn, xTicks, yTicks, x, y, bounds, innerWidth, innerHeight };
  });

  protected readonly tooltip = computed(() => {
    const plot = this.plot();
    const hoverX = this.hoverX();
    if (!plot || hoverX === null) return null;
    const time =
      plot.bounds.xMin +
      ((hoverX - PAD.left) / plot.innerWidth) * (plot.bounds.xMax - plot.bounds.xMin);
    const rows = plot.drawn
      .filter((entry) => entry.points.length > 0)
      .map((entry) => {
        const point = entry.points[nearest(entry.points, time)];
        return { name: entry.name, color: entry.color, time: point[0], value: point[1] };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    if (rows.length === 0) return null;
    const at = rows[0].time;
    return {
      x: plot.x(at),
      left: plot.x(at) > this.width() / 2,
      title: new Date(at).toLocaleString(),
      rows: rows.map((row) => ({ ...row, label: formatValue(row.value, this.unit()) })),
    };
  });

  protected readonly pad = PAD;

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const element = this.host.nativeElement as HTMLElement;
      this.width.set(element.clientWidth || 600);
      if (typeof ResizeObserver === 'undefined') return;
      const observer = new ResizeObserver(([entry]) =>
        this.width.set(entry.contentRect.width || 600),
      );
      observer.observe(element);
      destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected toggle(name: string): void {
    this.hidden.update((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  protected onMove(event: MouseEvent): void {
    const svg = event.currentTarget as SVGSVGElement;
    const box = svg.getBoundingClientRect();
    const x = event.clientX - box.left;
    this.hoverX.set(x < PAD.left || x > this.width() - PAD.right ? null : x);
  }
}

function gapThreshold(points: readonly (readonly [number, number])[]): number {
  if (points.length < 3) return Infinity;
  const steps: number[] = [];
  for (let i = 1; i < Math.min(points.length, 50); i++) steps.push(points[i][0] - points[i - 1][0]);
  steps.sort((a, b) => a - b);
  return steps[steps.length >> 1] * 3;
}
