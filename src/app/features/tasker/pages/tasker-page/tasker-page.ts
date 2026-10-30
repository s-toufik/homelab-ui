import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { WorkspaceStore } from '../../application/workspace.store';
import { BlockInspector } from '../../components/block-inspector/block-inspector';
import { BlockPalette } from '../../components/block-palette/block-palette';
import { PaneLayout } from '../../components/pane-layout/pane-layout';
import { WorkflowList } from '../../components/workflow-list/workflow-list';

const WIDTH_STORAGE_KEY = 'tasker.inspector-width';
const DEFAULT_WIDTH = 300;
const MIN_WIDTH = 240;

function readStoredWidth(): number {
  try {
    const stored = Number(localStorage.getItem(WIDTH_STORAGE_KEY));
    return Number.isFinite(stored) && stored > 0 ? Math.max(MIN_WIDTH, stored) : DEFAULT_WIDTH;
  } catch {
    return DEFAULT_WIDTH;
  }
}

@Component({
  selector: 'app-tasker-page',
  imports: [FormsModule, BlockPalette, PaneLayout, BlockInspector, WorkflowList],
  templateUrl: './tasker-page.html',
  styleUrl: './tasker-page.scss',
  host: { '(document:keydown)': 'onKeydown($event)' },
})
export class TaskerPage {
  protected readonly workspace = inject(WorkspaceStore);
  protected readonly document = this.workspace.activeDocument;
  protected readonly sideWidth = signal(readStoredWidth());

  protected readonly status = computed(() => {
    const document = this.document();
    if (!document) return '';
    if (document.saving()) return 'Saving…';
    if (document.saveError()) return 'Save failed';
    if (document.dirty()) return document.persisted() ? 'Unsaved changes' : 'Not saved yet';
    return 'Saved';
  });

  protected onKeydown(event: KeyboardEvent): void {
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
      const document = this.document();
      if (!document) return;
      event.preventDefault();
      void this.workspace.save(document.id);
    }
  }

  protected startResize(event: PointerEvent): void {
    event.preventDefault();
    const startX = event.clientX;
    const startWidth = this.sideWidth();
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (moveEvent: PointerEvent) => {
      this.sideWidth.set(Math.max(MIN_WIDTH, startWidth + (startX - moveEvent.clientX)));
    };
    const onUp = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      try {
        localStorage.setItem(WIDTH_STORAGE_KEY, String(this.sideWidth()));
      } catch {
        return;
      }
    };

    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
  }
}
