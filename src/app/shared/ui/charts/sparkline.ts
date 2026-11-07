import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-sparkline',
  template: `
    <svg [attr.viewBox]="'0 0 100 ' + height()" preserveAspectRatio="none" class="sparkline">
      @if (path(); as drawn) {
        <path class="sparkline__area" [attr.d]="drawn.area" [style.fill]="color()" />
        <path class="sparkline__line" [attr.d]="drawn.line" [style.stroke]="color()" />
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
      width: 100%;
    }
    .sparkline {
      display: block;
      width: 100%;
      height: 100%;
      overflow: visible;
    }
    .sparkline__line {
      fill: none;
      stroke-width: 1.5;
      vector-effect: non-scaling-stroke;
    }
    .sparkline__area {
      opacity: 0.15;
    }
  `,
})
export class Sparkline {
  readonly points = input.required<readonly (readonly [number, number])[]>();
  readonly color = input('var(--chart-1)');
  readonly height = input(30);
  readonly min = input<number | null>(0);
  readonly max = input<number | null>(null);

  protected readonly path = computed(() => {
    const points = this.points().filter(([, value]) => Number.isFinite(value));
    if (points.length < 2) return null;
    const times = points.map(([time]) => time);
    const values = points.map(([, value]) => value);
    const xMin = Math.min(...times);
    const xMax = Math.max(...times);
    const yMin = this.min() ?? Math.min(...values);
    const yMax = Math.max(this.max() ?? Math.max(...values), yMin + 1e-9);
    const height = this.height();
    const coords = points.map(([time, value]) => [
      ((time - xMin) / Math.max(xMax - xMin, 1)) * 100,
      height - ((value - yMin) / (yMax - yMin)) * (height - 2) - 1,
    ]);
    const line = coords
      .map(([x, y], i) => `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`)
      .join('');
    const area = `${line}L100 ${height}L0 ${height}Z`;
    return { line, area };
  });
}
