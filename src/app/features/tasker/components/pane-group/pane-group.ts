import {
  Component,
  Injector,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { FeatureIcon } from '@shell/feature-icon/feature-icon';
import { WorkspaceStore } from '../../application/workspace.store';
import type { WorkflowDocumentStore } from '../../application/workflow-document.store';
import type { DropEdge, PaneGroup as PaneGroupNode } from '../../domain/pane-layout';
import { Canvas } from '../canvas/canvas';

export const TAB_DRAG_TYPE = 'application/x-tasker-tab';
export const WORKFLOW_DRAG_TYPE = 'application/x-tasker-workflow';

const EDGE_ZONE = 0.25;

export const PANE_ICONS = {
  splitRight: ['M4 5h16v14H4Z', 'M12 5v14'],
  splitDown: ['M4 5h16v14H4Z', 'M4 12h16'],
  layout: ['M3 6h6v4H3Z', 'M15 14h6v4h-6Z', 'M9 8h3v8h3'],
  recenter: ['M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z', 'M12 3v4', 'M12 17v4', 'M3 12h4', 'M17 12h4'],
} as const;

@Component({
  selector: 'app-pane-group',
  imports: [Canvas, FeatureIcon],
  templateUrl: './pane-group.html',
  styleUrl: './pane-group.scss',
})
export class PaneGroup {
  readonly group = input.required<PaneGroupNode>();
  protected readonly workspace = inject(WorkspaceStore);
  protected readonly icons = PANE_ICONS;
  protected readonly dropEdge = signal<DropEdge | null>(null);
  private readonly canvas = viewChild(Canvas);
  private readonly injector = inject(Injector);

  protected readonly tabs = computed(() =>
    this.group()
      .tabs.map((id) => this.workspace.document(id))
      .filter((document): document is WorkflowDocumentStore => document !== null),
  );
  protected readonly activeDocument = computed(() => {
    const active = this.group().active;
    return active ? this.workspace.document(active) : null;
  });
  protected readonly isFocused = computed(
    () =>
      this.workspace.layout().type === 'split' &&
      this.workspace.activeGroup().id === this.group().id,
  );

  protected recenter(): void {
    this.canvas()?.fitView();
  }

  protected arrange(document: WorkflowDocumentStore): void {
    document.autoLayout();
    afterNextRender(() => this.recenter(), { injector: this.injector });
  }

  protected close(event: Event, docId: string): void {
    event.stopPropagation();
    this.workspace.closeTab(docId);
  }

  protected onTabDragStart(event: DragEvent, docId: string): void {
    event.dataTransfer?.setData(TAB_DRAG_TYPE, docId);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
    setTimeout(() => this.workspace.dragging.set(true));
  }

  protected onDragEnd(): void {
    this.workspace.dragging.set(false);
    this.dropEdge.set(null);
  }

  protected onBarDragOver(event: DragEvent): void {
    if (!this.accepts(event)) return;
    event.preventDefault();
    this.dropEdge.set(null);
  }

  protected onContentDragOver(event: DragEvent): void {
    if (!this.accepts(event)) return;
    event.preventDefault();
    const target = event.currentTarget as HTMLElement;
    const rect = target.getBoundingClientRect();
    const x = (event.clientX - rect.left) / rect.width;
    const y = (event.clientY - rect.top) / rect.height;
    this.dropEdge.set(
      x < EDGE_ZONE
        ? 'left'
        : x > 1 - EDGE_ZONE
          ? 'right'
          : y < EDGE_ZONE
            ? 'top'
            : y > 1 - EDGE_ZONE
              ? 'bottom'
              : 'center',
    );
  }

  protected onDrop(event: DragEvent, edge: DropEdge | null): void {
    event.preventDefault();
    const tab = event.dataTransfer?.getData(TAB_DRAG_TYPE);
    const workflow = event.dataTransfer?.getData(WORKFLOW_DRAG_TYPE);
    const target = edge ?? 'center';
    if (tab) this.workspace.moveTab(tab, this.group().id, target);
    else if (workflow) void this.workspace.openWorkflow(workflow, this.group().id, target);
    this.onDragEnd();
  }

  private accepts(event: DragEvent): boolean {
    const types = event.dataTransfer?.types ?? [];
    return types.includes(TAB_DRAG_TYPE) || types.includes(WORKFLOW_DRAG_TYPE);
  }
}
