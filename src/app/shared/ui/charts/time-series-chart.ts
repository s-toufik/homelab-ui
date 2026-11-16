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
const MIN_BRUSH_X = 6;
const MIN_BRUSH_Y = 18;
let nextChartId = 0;

export interface ChartView {
  readonly x0: number;
  readonly x1: number;
  readonly y0: number | null;
  readonly y1: number | null;
}

type Zone = 'plot' | 'x' | 'y';

interface Drag {
  readonly zone: Zone;
  readonly x: number;
  readonly y: number;
  readonly view: ChartView & { y0: number; y1: number };
}

export function zoomRange(
  low: number,
  high: number,
  center: number,
  factor: number,
): [number, number] {
  return [center - (center - low) * factor, center + (high - center) * factor];
}

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
  protected readonly view = signal<ChartView | null>(null);
  protected readonly brush = signal<{ x0: number; y0: number; x1: number; y1: number } | null>(
    null,
  );
  protected readonly clipId = `chart-clip-${nextChartId++}`;
  private drag: Drag | null = null;

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
    const full = {
      xMin,
      xMax: Math.max(xMax, xMin + 1),
      yMin: low,
      yMax: Math.max(high, ticks.at(-1) ?? high),
      ticks,
    };
    const view = this.view();
    if (!view || view.x1 <= full.xMin || view.x0 >= full.xMax) return full;
    const zoomedY = view.y0 !== null && view.y1 !== null;
    const yMinView = zoomedY ? view.y0! : full.yMin;
    const yMaxView = zoomedY ? view.y1! : full.yMax;
    return {
      xMin: view.x0,
      xMax: view.x1,
      yMin: yMinView,
      yMax: yMaxView,
      ticks: zoomedY
        ? niceTicks(yMinView, yMaxView).filter((tick) => tick >= yMinView && tick <= yMaxView)
        : full.ticks,
    };
  });

  protected readonly zoomed = computed(() => this.view() !== null);

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

  protected onMove(event: PointerEvent): void {
    const { x, y } = this.local(event);
    const drag = this.drag;
    const plot = this.plot();
    if (drag && plot) {
      if (drag.zone === 'plot') {
        this.brush.update((brush) => brush && { ...brush, x1: this.clampX(x), y1: this.clampY(y) });
      } else if (drag.zone === 'x') {
        const shift = ((drag.x - x) / plot.innerWidth) * (drag.view.x1 - drag.view.x0);
        this.view.set({ ...this.current(), x0: drag.view.x0 + shift, x1: drag.view.x1 + shift });
      } else {
        const shift = ((y - drag.y) / plot.innerHeight) * (drag.view.y1 - drag.view.y0);
        this.view.set({ ...this.current(), y0: drag.view.y0 + shift, y1: drag.view.y1 + shift });
      }
      return;
    }
    this.hoverX.set(x < PAD.left || x > this.width() - PAD.right ? null : x);
  }

  protected onDown(event: PointerEvent): void {
    if (event.button !== 0 || event.pointerType === 'touch') return;
    const { x, y } = this.local(event);
    const zone = this.zone(x, y);
    if (!zone || !this.plot()) return;
    event.preventDefault();
    try {
      (event.currentTarget as Element).setPointerCapture(event.pointerId);
    } catch {
      // The pointer is already gone; the drag still works while it stays over the chart.
    }
    this.drag = { zone, x, y, view: this.current() };
    this.hoverX.set(null);
    if (zone === 'plot') this.brush.set({ x0: x, y0: y, x1: x, y1: y });
  }

  protected onUp(): void {
    const drag = this.drag;
    const brush = this.brush();
    const plot = this.plot();
    this.drag = null;
    this.brush.set(null);
    if (!drag || drag.zone !== 'plot' || !brush || !plot) return;
    if (Math.abs(brush.x1 - brush.x0) < MIN_BRUSH_X) return;
    const time = (px: number) =>
      plot.bounds.xMin +
      ((px - PAD.left) / plot.innerWidth) * (plot.bounds.xMax - plot.bounds.xMin);
    const value = (py: number) =>
      plot.bounds.yMin +
      ((PAD.top + plot.innerHeight - py) / plot.innerHeight) *
        (plot.bounds.yMax - plot.bounds.yMin);
    const tall = Math.abs(brush.y1 - brush.y0) >= MIN_BRUSH_Y;
    this.view.set({
      x0: time(Math.min(brush.x0, brush.x1)),
      x1: time(Math.max(brush.x0, brush.x1)),
      y0: tall ? value(Math.max(brush.y0, brush.y1)) : (this.view()?.y0 ?? null),
      y1: tall ? value(Math.min(brush.y0, brush.y1)) : (this.view()?.y1 ?? null),
    });
  }

  protected onWheel(event: WheelEvent): void {
    const plot = this.plot();
    if (!plot) return;
    const { x, y } = this.local(event);
    const zone = this.zone(x, y);
    if (!zone || (zone === 'plot' && !event.ctrlKey && !event.metaKey)) return;
    event.preventDefault();
    const factor = Math.exp(Math.max(-1, Math.min(1, event.deltaY * 0.002)));
    const current = this.current();
    if (zone === 'y') {
      const center =
        plot.bounds.yMin +
        ((PAD.top + plot.innerHeight - y) / plot.innerHeight) *
          (plot.bounds.yMax - plot.bounds.yMin);
      const [y0, y1] = zoomRange(current.y0, current.y1, center, factor);
      this.view.set({ ...current, y0, y1 });
    } else {
      const center =
        plot.bounds.xMin +
        ((this.clampX(x) - PAD.left) / plot.innerWidth) * (plot.bounds.xMax - plot.bounds.xMin);
      const [x0, x1] = zoomRange(current.x0, current.x1, center, factor);
      if (x1 - x0 >= 1000) this.view.set({ ...current, x0, x1 });
    }
  }

  protected reset(): void {
    this.view.set(null);
    this.brush.set(null);
  }

  private current(): ChartView & { y0: number; y1: number } {
    const bounds = this.bounds()!;
    return { x0: bounds.xMin, x1: bounds.xMax, y0: bounds.yMin, y1: bounds.yMax };
  }

  private local(event: MouseEvent): { x: number; y: number } {
    const box = (event.currentTarget as Element).getBoundingClientRect();
    return { x: event.clientX - box.left, y: event.clientY - box.top };
  }

  private zone(x: number, y: number): Zone | null {
    const right = this.width() - PAD.right;
    const bottom = this.height() - PAD.bottom;
    if (x >= PAD.left && x <= right && y >= PAD.top && y <= bottom) return 'plot';
    if (x < PAD.left && y >= PAD.top && y <= bottom) return 'y';
    if (y > bottom && x >= PAD.left && x <= right) return 'x';
    return null;
  }

  private clampX(x: number): number {
    return Math.min(Math.max(x, PAD.left), this.width() - PAD.right);
  }

  private clampY(y: number): number {
    return Math.min(Math.max(y, PAD.top), this.height() - PAD.bottom);
  }
}

function gapThreshold(points: readonly (readonly [number, number])[]): number {
  if (points.length < 3) return Infinity;
  const steps: number[] = [];
  for (let i = 1; i < Math.min(points.length, 50); i++) steps.push(points[i][0] - points[i - 1][0]);
  steps.sort((a, b) => a - b);
  return steps[steps.length >> 1] * 3;
}
