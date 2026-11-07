import { Component, computed, inject, signal } from '@angular/core';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { groupByKind, type PipelineComponent } from '../../domain/component';
import { AlloyApiService } from '../../infrastructure/api/alloy-api.service';

@Component({
  selector: 'app-pipeline-page',
  imports: [PageHeader],
  templateUrl: './pipeline-page.html',
  styleUrl: './pipeline-page.scss',
})
export class PipelinePage {
  private readonly api = inject(AlloyApiService);
  protected readonly components = signal<PipelineComponent[]>([]);
  protected readonly groups = computed(() => groupByKind(this.components()));
  protected readonly unhealthy = computed(
    () => this.components().filter((c) => c.health !== 'healthy').length,
  );
  protected readonly error = signal<string | null>(null);
  protected readonly selected = signal<PipelineComponent | null>(null);
  protected readonly details = signal<string>('');

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    try {
      this.components.set(await this.api.components());
      this.error.set(null);
    } catch (error) {
      this.error.set((error as Error).message);
    }
  }

  protected async open(component: PipelineComponent): Promise<void> {
    this.selected.set(component);
    this.details.set('Loading…');
    try {
      this.details.set(JSON.stringify(await this.api.details(component.id), null, 2));
    } catch (error) {
      this.details.set((error as Error).message);
    }
  }

  protected find(id: string): PipelineComponent | undefined {
    return this.components().find((component) => component.id === id);
  }
}
