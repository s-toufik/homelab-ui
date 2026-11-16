import { Component } from '@angular/core';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { Appearance } from './appearance';

@Component({
  selector: 'app-appearance-page',
  imports: [PageHeader, Appearance],
  template: `
    <div class="hl-page">
      <app-page-header eyebrow="Settings" title="Appearance" hue="indigo" />
      <app-appearance />
    </div>
  `,
  styles: ':host { display: flex; flex: 1 1 auto; min-height: 0; }',
})
export class AppearancePage {}
