import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, effect, inject } from '@angular/core';
import { ScrollLockService } from '@shared/ui/scroll-lock/scroll-lock.service';
import { MapDetails } from '../../components/map-details/map-details';
import { MapOverview } from '../../components/map-overview/map-overview';
import { MapServices } from '../../components/map-services/map-services';
import { MapStore } from '../../application/map.store';

const MOBILE_BREAKPOINT_PX = 767;

@Component({
  selector: 'app-map-page',
  imports: [MapOverview, MapServices, MapDetails, DecimalPipe, DatePipe],
  templateUrl: './map-page.html',
  styleUrl: './map-page.scss',
})
export class MapPage {
  protected readonly store = inject(MapStore);
  private readonly scrollLock = inject(ScrollLockService);
  protected readonly gauges = computed(() => this.store.node.gauges());
  protected readonly stats = computed(() => [
    { key: 'CPU', value: this.gauges().cpu },
    { key: 'Memory', value: this.gauges().memory },
    { key: 'Disk', value: this.gauges().disk },
  ]);

  constructor() {
    this.store.start();

    // Below 767px, .map__details becomes a fixed bottom sheet over the page (map-page.scss);
    // above it, it's just a calm inline side panel that covers nothing, so scroll must stay free.
    effect((onCleanup) => {
      if (this.store.selected() && window.innerWidth <= MOBILE_BREAKPOINT_PX) {
        this.scrollLock.lock();
        onCleanup(() => this.scrollLock.unlock());
      }
    });
  }
}
