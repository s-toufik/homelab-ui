import { Component, inject } from '@angular/core';
import { WorkspaceStore } from '../../application/workspace.store';
import type { WorkflowSummary } from '../../domain/workflow';
import { WORKFLOW_DRAG_TYPE } from '../pane-group/pane-group';

const DATE_FORMAT = new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' });

@Component({
  selector: 'app-workflow-list',
  imports: [],
  templateUrl: './workflow-list.html',
  styleUrl: './workflow-list.scss',
})
export class WorkflowList {
  protected readonly workspace = inject(WorkspaceStore);

  protected isOpen(id: string): boolean {
    return this.workspace.documents().has(id);
  }

  protected updated(workflow: WorkflowSummary): string {
    const date = new Date(workflow.updatedAt);
    return Number.isNaN(date.getTime()) ? '' : DATE_FORMAT.format(date);
  }

  protected onDragStart(event: DragEvent, id: string): void {
    event.dataTransfer?.setData(WORKFLOW_DRAG_TYPE, id);
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copyMove';
    setTimeout(() => this.workspace.dragging.set(true));
  }

  protected onDragEnd(): void {
    this.workspace.dragging.set(false);
  }
}
