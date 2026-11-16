import { Component, inject } from '@angular/core';
import { MapStore } from '../../application/map.store';
import { NETWORKS, PORTS } from '../../domain/map-layout';

@Component({
  selector: 'app-map-overview',
  templateUrl: './map-overview.html',
  styleUrl: './map-overview.scss',
})
export class MapOverview {
  protected readonly store = inject(MapStore);
  protected readonly networks = NETWORKS;
  protected readonly ports = PORTS;

  protected lit(services: readonly string[]): boolean {
    const id = this.store.selected();
    return !!id && services.includes(id);
  }
}
