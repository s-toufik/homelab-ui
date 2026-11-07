import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { formatValue } from '@shared/ui/charts/chart-format';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { TimeRange } from '@shared/ui/time-range/time-range';
import { TracesStore } from '../../application/traces.store';

@Component({
  selector: 'app-traces-page',
  imports: [FormsModule, DatePipe, DecimalPipe, PageHeader, TimeRange],
  templateUrl: './traces-page.html',
  styleUrl: './traces-page.scss',
})
export class TracesPage {
  protected readonly store = inject(TracesStore);

  constructor() {
    void this.store.loadServices();
    if (this.store.results().length === 0) void this.store.search();
  }

  protected duration(ms: number): string {
    return formatValue(ms / 1000, 'seconds');
  }
}
