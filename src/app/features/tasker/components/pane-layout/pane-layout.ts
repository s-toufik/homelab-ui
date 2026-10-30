import { Component, computed, inject, input } from '@angular/core';
import { WorkspaceStore } from '../../application/workspace.store';
import {
  MIN_PANE_SIZE,
  type LayoutNode,
  type PaneGroup as PaneGroupNode,
  type PaneSplit,
} from '../../domain/pane-layout';
import { PaneGroup } from '../pane-group/pane-group';

@Component({
  selector: 'app-pane-layout',
  imports: [PaneGroup],
  templateUrl: './pane-layout.html',
  styleUrl: './pane-layout.scss',
})
export class PaneLayout {
  readonly node = input.required<LayoutNode>();
  private readonly workspace = inject(WorkspaceStore);

  protected readonly split = computed(() => {
    const node = this.node();
    return node.type === 'split' ? (node as PaneSplit) : null;
  });
  protected readonly group = computed(() => {
    const node = this.node();
    return node.type === 'group' ? (node as PaneGroupNode) : null;
  });

  protected startResize(event: PointerEvent, index: number, container: HTMLElement): void {
    const split = this.split();
    if (!split) return;
    event.preventDefault();

    const horizontal = split.direction === 'row';
    const rect = container.getBoundingClientRect();
    const total = horizontal ? rect.width : rect.height;
    const start = horizontal ? event.clientX : event.clientY;
    const sizes = [...split.sizes];
    const pair = sizes[index] + sizes[index + 1];
    document.body.style.cursor = horizontal ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';

    const onMove = (moveEvent: PointerEvent) => {
      const position = horizontal ? moveEvent.clientX : moveEvent.clientY;
      const first = Math.min(
        pair - MIN_PANE_SIZE,
        Math.max(MIN_PANE_SIZE, sizes[index] + (position - start) / total),
      );
      const next = [...sizes];
      next[index] = first;
      next[index + 1] = pair - first;
      this.workspace.resizeSplit(split.id, next);
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }
}
