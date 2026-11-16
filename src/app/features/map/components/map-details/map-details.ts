import { Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CommandPaletteStore } from '@shell/application/commands';
import { FeatureIcon } from '@shell/feature-icon/feature-icon';
import { MapStore } from '../../application/map.store';
import { OUTSIDE, categoryOf, neighbours, serviceById } from '../../domain/map-layout';
import { GLYPHS, STATE_COLOR } from '../../domain/glyphs';

@Component({
  selector: 'app-map-details',
  imports: [FeatureIcon, RouterLink],
  templateUrl: './map-details.html',
  styleUrl: './map-details.scss',
})
export class MapDetails {
  protected readonly store = inject(MapStore);
  private readonly palette = inject(CommandPaletteStore);
  protected readonly glyphs = GLYPHS;
  protected readonly color = STATE_COLOR;
  protected readonly confirming = signal(false);

  protected readonly service = computed(() => {
    const id = this.store.selected();
    return id ? (serviceById(id) ?? null) : null;
  });
  protected readonly category = computed(() =>
    this.service() ? categoryOf(this.service()!.id) : undefined,
  );
  protected readonly status = computed(() =>
    this.service() ? this.store.statuses()[this.service()!.id] : null,
  );
  protected readonly links = computed(() => {
    const id = this.service()?.id;
    if (!id) return { out: [], used: [] };
    const describe = (other: string) => ({
      id: other,
      label: other === 'provider' ? OUTSIDE.provider : other,
      group: other === 'provider' ? 'Internet' : (categoryOf(other)?.title ?? ''),
      state: this.store.statuses()[other]?.state ?? 'ok',
      clickable: other !== 'provider',
    });
    const { out, used } = neighbours(id);
    return { out: out.map(describe), used: used.map(describe) };
  });

  protected select(id: string): void {
    this.confirming.set(false);
    this.store.selected.set(id);
  }

  protected ask(): void {
    this.palette.open(`Is ${this.service()?.id} healthy?`);
  }

  protected async restart(): Promise<void> {
    const id = this.service()?.id;
    this.confirming.set(false);
    if (id) await this.store.restart(id);
  }
}
