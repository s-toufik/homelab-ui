import { Component, input } from '@angular/core';

export type SwarmPhase = 'idle' | 'thinking' | 'executor' | 'final' | 'error';

type Orbit = [
  tilt: number,
  radiusX: number,
  radiusY: number,
  lapSeconds: number,
  direction: 1 | -1,
  dotSize: number,
  startAngle: number,
];

const ORBITS: Orbit[] = [
  [10, 26, 9, 2.6, 1, 2.8, 25],
  [62, 22, 10, 1.9, -1, 2.4, 175],
  [118, 25, 8, 2.3, 1, 2.6, 335],
  [155, 19, 8, 1.4, 1, 2.2, 0],
  [35, 16, 7, 1.1, -1, 2.0, 210],
  [95, 21, 11, 1.7, -1, 2.5, 155],
  [140, 24, 12, 2.9, 1, 2.3, 210],
  [78, 14, 6, 0.9, 1, 1.9, 330],
];

function electron([tilt, rx, ry, lap, direction, size, start]: Orbit) {
  const theta = (start * Math.PI) / 180;
  const dx = (start / 360) * lap;
  const dy = (((dx - (direction * lap) / 4) % lap) + lap) % lap;
  return {
    tilt,
    size,
    rx: `${rx}px`,
    ry: `${ry}px`,
    x0: `${(-rx * Math.cos(theta)).toFixed(2)}px`,
    y0: `${(-direction * ry * Math.sin(theta)).toFixed(2)}px`,
    h: `${lap / 2}s`,
    dx: `${dx.toFixed(3)}s`,
    dy: `${dy.toFixed(3)}s`,
  };
}

@Component({
  selector: 'app-swarm-avatar',
  template: `
    <svg
      viewBox="0 0 64 64"
      class="avatar"
      [attr.width]="size()"
      [attr.height]="size()"
      [class.live]="live()"
      [attr.data-phase]="phase()"
      role="img"
      [attr.aria-label]="live() ? 'Assistant is responding' : 'Assistant'"
    >
      @for (e of electrons; track $index) {
        <g [attr.transform]="'rotate(' + e.tilt + ' 32 32)'">
          <g
            class="ex"
            [style.--x0]="e.x0"
            [style.--rx]="e.rx"
            [style.--h]="e.h"
            [style.--dx]="e.dx"
          >
            <g class="ey" [style.--y0]="e.y0" [style.--ry]="e.ry" [style.--dy]="e.dy">
              <circle class="dot" cx="32" cy="32" [attr.r]="e.size" />
            </g>
          </g>
        </g>
      }
      <circle class="core" cx="32" cy="32" r="5" />
    </svg>
  `,
  styles: `
    :host {
      display: inline-block;
      line-height: 0;
    }
    .avatar {
      --c: var(--accent);
      --s: 1;
      overflow: visible;
    }
    .live[data-phase='executor'] {
      --c: var(--success);
      --s: 0.45;
    }
    .live[data-phase='final'] {
      --c: var(--accent-hover);
      --s: 0.7;
    }
    .avatar[data-phase='error'] {
      --c: var(--danger);
    }
    .dot,
    .core {
      fill: var(--c);
      transition: fill 0.4s;
    }
    .dot {
      opacity: 0.9;
    }
    .core {
      transform-box: view-box;
      transform-origin: 32px 32px;
    }
    .ex {
      transform: translateX(var(--x0));
    }
    .ey {
      transform: translateY(var(--y0));
    }
    .live .ex {
      animation: ox calc(var(--s) * var(--h)) cubic-bezier(0.37, 0, 0.63, 1) infinite alternate;
      animation-delay: calc(var(--s) * var(--dx) * -1);
    }
    .live .ey {
      animation: oy calc(var(--s) * var(--h)) cubic-bezier(0.37, 0, 0.63, 1) infinite alternate;
      animation-delay: calc(var(--s) * var(--dy) * -1);
    }
    .live .core {
      animation: beat calc(var(--s) * 1.4s) ease-in-out infinite;
    }
    @keyframes ox {
      from {
        transform: translateX(calc(var(--rx) * -1));
      }
      to {
        transform: translateX(var(--rx));
      }
    }
    @keyframes oy {
      from {
        transform: translateY(calc(var(--ry) * -1));
      }
      to {
        transform: translateY(var(--ry));
      }
    }
    @keyframes beat {
      0%,
      100% {
        transform: scale(1);
      }
      35% {
        transform: scale(1.18);
      }
      60% {
        transform: scale(0.95);
      }
    }
    @media (prefers-reduced-motion: reduce) {
      .live .ex,
      .live .ey,
      .live .core {
        animation: none;
      }
    }
  `,
})
export class SwarmAvatar {
  readonly size = input(32);
  readonly live = input(false);
  readonly phase = input<SwarmPhase>('idle');

  protected readonly electrons = ORBITS.map(electron);
}
