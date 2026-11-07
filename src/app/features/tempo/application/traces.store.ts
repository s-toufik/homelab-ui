import { Injectable, computed, inject, signal } from '@angular/core';
import { type TimeRangeId, timeWindow } from '@shared/ui/time-range/time-range';
import { type Span, type TraceSummary, waterfall } from '../domain/trace';
import { TempoApiService } from '../infrastructure/api/tempo-api.service';

@Injectable({ providedIn: 'root' })
export class TracesStore {
  private readonly api = inject(TempoApiService);

  readonly services = signal<string[]>([]);
  readonly service = signal('');
  readonly name = signal('');
  readonly minDurationMs = signal<number | null>(null);
  readonly traceql = signal('');
  readonly range = signal<TimeRangeId>('1h');
  readonly results = signal<TraceSummary[]>([]);
  readonly searching = signal(false);
  readonly error = signal<string | null>(null);

  readonly selectedId = signal<string | null>(null);
  readonly spans = signal<Span[]>([]);
  readonly loadingTrace = signal(false);
  readonly traceError = signal<string | null>(null);
  readonly selectedSpan = signal<Span | null>(null);

  readonly view = computed(() => waterfall(this.spans()));
  readonly slowest = computed(() => Math.max(1, ...this.results().map((t) => t.durationMs)));

  async loadServices(): Promise<void> {
    try {
      this.services.set(await this.api.services());
    } catch {
      this.services.set([]);
    }
  }

  async search(): Promise<void> {
    if (this.searching()) return;
    this.searching.set(true);
    this.error.set(null);
    const window = timeWindow(this.range());
    try {
      this.results.set(
        await this.api.search({
          service: this.service() || undefined,
          name: this.name().trim() || undefined,
          minDurationMs: this.minDurationMs() ?? undefined,
          traceql: this.traceql(),
          startSec: window.startSec,
          endSec: window.endSec,
        }),
      );
    } catch (error) {
      this.error.set((error as Error).message);
      this.results.set([]);
    } finally {
      this.searching.set(false);
    }
  }

  async open(traceId: string): Promise<void> {
    this.selectedId.set(traceId);
    this.selectedSpan.set(null);
    this.loadingTrace.set(true);
    this.traceError.set(null);
    try {
      this.spans.set(await this.api.trace(traceId));
    } catch (error) {
      this.traceError.set((error as Error).message);
      this.spans.set([]);
    } finally {
      this.loadingTrace.set(false);
    }
  }

  close(): void {
    this.selectedId.set(null);
    this.spans.set([]);
    this.selectedSpan.set(null);
  }
}
