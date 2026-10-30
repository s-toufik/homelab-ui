import {
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  untracked,
  viewChild,
} from '@angular/core';
import type { WorkflowDocumentStore } from '../../application/workflow-document.store';
import type { CanvasEngine, CanvasEngineState } from '../../domain/canvas-engine';
import { CANVAS_ENGINE } from './canvas-engine.token';

@Component({
  selector: 'app-tasker-canvas',
  imports: [],
  templateUrl: './canvas.html',
  styleUrl: './canvas.scss',
})
export class Canvas implements OnDestroy {
  readonly store = input.required<WorkflowDocumentStore>();
  private readonly createEngine = inject(CANVAS_ENGINE);
  private readonly host = viewChild.required<ElementRef<HTMLElement>>('host');
  private engine: CanvasEngine | null = null;
  private enginePromise: Promise<CanvasEngine> | null = null;
  private destroyed = false;

  constructor() {
    effect(() => {
      const store = this.store();
      const state: CanvasEngineState = {
        blocks: store.blocks(),
        connections: store.connections(),
        selectedIds: store.selectedIds(),
        results: store.results(),
      };

      if (!this.enginePromise) {
        untracked(() => this.start(store, state));
        return;
      }
      this.engine?.sync(state);
    });
  }

  fitView(): void {
    void this.enginePromise?.then((engine) => engine.fitView());
  }

  ngOnDestroy(): void {
    this.destroyed = true;
    void this.enginePromise?.then((engine) => engine.destroy());
  }

  private start(store: WorkflowDocumentStore, state: CanvasEngineState): void {
    this.enginePromise = Promise.resolve(this.createEngine()).then(async (engine) => {
      if (this.destroyed) return engine;
      await engine.mount(this.host().nativeElement, {
        onMove: (id, x, y) => this.store().moveBlock(id, x, y),
        onConnect: (fromId, toId, suggestedId) => this.store().connect(fromId, toId, suggestedId),
        onDisconnect: (id) => this.store().disconnect(id),
        onSelect: (id, additive) => this.store().select(id, additive),
      });
      this.engine = engine;
      engine.sync({
        blocks: store.blocks(),
        connections: store.connections(),
        selectedIds: store.selectedIds(),
        results: store.results(),
      });
      if (state.blocks.length > 0) void engine.fitView();
      return engine;
    });
  }
}
