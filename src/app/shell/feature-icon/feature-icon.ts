import { Component, input } from '@angular/core';
import type { FeatureIcon as FeatureIconPaths } from '../domain/homelab-feature';

@Component({
  selector: 'app-feature-icon',
  template: `
    <svg
      viewBox="0 0 24 24"
      [attr.width]="size()"
      [attr.height]="size()"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @for (path of paths(); track $index) {
        <path [attr.d]="path" />
      }
    </svg>
  `,
  styles: ':host { display: flex; }',
})
export class FeatureIcon {
  readonly paths = input.required<FeatureIconPaths>();
  readonly size = input(18);
}
