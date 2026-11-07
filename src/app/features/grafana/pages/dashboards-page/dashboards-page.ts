import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { TimeRange, type TimeRangeId, timeWindow } from '@shared/ui/time-range/time-range';
import { map } from 'rxjs';
import { DashboardPanel } from '../../components/dashboard-panel/dashboard-panel';
import { DASHBOARDS } from '../../domain/dashboards';

const REFRESH_MS = 60_000;

@Component({
  selector: 'app-dashboards-page',
  imports: [RouterLink, PageHeader, TimeRange, DashboardPanel],
  templateUrl: './dashboards-page.html',
  styleUrl: './dashboards-page.scss',
})
export class DashboardsPage {
  protected readonly dashboards = DASHBOARDS;
  private readonly id = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((params) => params.get('id'))),
  );
  protected readonly dashboard = computed(
    () => DASHBOARDS.find((dashboard) => dashboard.id === this.id()) ?? DASHBOARDS[0],
  );
  protected readonly range = signal<TimeRangeId>('6h');
  private readonly tick = signal(0);
  protected readonly window = computed(() => {
    this.tick();
    return timeWindow(this.range(), Date.now(), 180);
  });

  constructor() {
    const timer = setInterval(() => this.refresh(), REFRESH_MS);
    inject(DestroyRef).onDestroy(() => clearInterval(timer));
  }

  protected refresh(): void {
    this.tick.update((value) => value + 1);
  }
}
