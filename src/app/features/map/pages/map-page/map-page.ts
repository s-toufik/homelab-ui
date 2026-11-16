import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { MapDetails } from '../../components/map-details/map-details';
import { MapOverview } from '../../components/map-overview/map-overview';
import { MapServices } from '../../components/map-services/map-services';
import { MapStore } from '../../application/map.store';

@Component({
  selector: 'app-map-page',
  imports: [MapOverview, MapServices, MapDetails, DecimalPipe, DatePipe],
  templateUrl: './map-page.html',
  styleUrl: './map-page.scss',
})
export class MapPage {
  protected readonly store = inject(MapStore);
  protected readonly gauges = computed(() => this.store.node.gauges());
  protected readonly stats = computed(() => [
    { key: 'CPU', value: this.gauges().cpu },
    { key: 'Memory', value: this.gauges().memory },
    { key: 'Disk', value: this.gauges().disk },
  ]);

  constructor() {
    this.store.start();
  }
}
