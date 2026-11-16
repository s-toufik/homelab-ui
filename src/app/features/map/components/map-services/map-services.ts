import { Component, computed, inject } from '@angular/core';
import { FeatureIcon } from '@shell/feature-icon/feature-icon';
import { MapStore } from '../../application/map.store';
import { CATEGORIES, neighbours } from '../../domain/map-layout';
import { GLYPHS, STATE_COLOR } from '../../domain/glyphs';

@Component({
  selector: 'app-map-services',
  imports: [FeatureIcon],
  templateUrl: './map-services.html',
  styleUrl: './map-services.scss',
})
export class MapServices {
  protected readonly store = inject(MapStore);
  protected readonly categories = CATEGORIES;
  protected readonly glyphs = GLYPHS;
  protected readonly color = STATE_COLOR;
  protected readonly related = computed(() => {
    const id = this.store.selected();
    if (!id) return new Set<string>();
    const { out, used } = neighbours(id);
    return new Set([...out, ...used]);
  });

  protected pick(id: string): void {
    this.store.selected.set(this.store.selected() === id ? null : id);
  }
}
