import { Injectable, computed, effect, inject, signal } from '@angular/core';
import type { BlockKind } from '../domain/block-kind';
import {
  addTab,
  activateTab,
  allGroups,
  closeTab,
  createGroup,
  findGroup,
  groupOf,
  moveTab,
  openTabs,
  resizeSplit,
  type DropEdge,
  type LayoutNode,
} from '../domain/pane-layout';
import {
  UNTITLED_WORKFLOW,
  type BlockConfig,
  type WorkflowDocument,
  type WorkflowSummary,
} from '../domain/workflow';
import {
  LegacyTaskerStorage,
  WorkspaceSessionStorage,
  type DocumentDraft,
} from '../infrastructure/storage/workspace-session.storage';
import { BlockExecutor } from './block-executor';
import { TASKER_CONFIRM, TASKER_ID, WORKFLOW_REPOSITORY } from './tasker-tokens';
import { WorkflowDocumentStore } from './workflow-document.store';

export type ListState = 'loading' | 'ready' | 'error';

const SESSION_WRITE_DELAY_MS = 300;

@Injectable({ providedIn: 'root' })
export class WorkspaceStore {
  private readonly repository = inject(WORKFLOW_REPOSITORY);
  private readonly session = inject(WorkspaceSessionStorage);
  private readonly legacy = inject(LegacyTaskerStorage);
  private readonly executor = inject(BlockExecutor);
  private readonly confirm = inject(TASKER_CONFIRM);
  private readonly newId = inject(TASKER_ID);
  private writeTimer: ReturnType<typeof setTimeout> | null = null;

  readonly documents = signal<ReadonlyMap<string, WorkflowDocumentStore>>(new Map());
  readonly layout = signal<LayoutNode>(createGroup('pane'));
  readonly activeGroupId = signal('pane');
  readonly dragging = signal(false);

  readonly workflows = signal<readonly WorkflowSummary[]>([]);
  readonly listState = signal<ListState>('loading');
  readonly listError = signal<string | null>(null);

  readonly activeGroup = computed(
    () => findGroup(this.layout(), this.activeGroupId()) ?? allGroups(this.layout())[0],
  );
  readonly activeDocument = computed(() => {
    const active = this.activeGroup()?.active;
    return active ? (this.documents().get(active) ?? null) : null;
  });

  constructor() {
    this.restore();
    effect(() => {
      const session = {
        layout: this.layout(),
        activeGroupId: this.activeGroupId(),
        documents: [...this.documents().values()].map((document) => document.snapshot()),
      };
      if (this.writeTimer) clearTimeout(this.writeTimer);
      this.writeTimer = setTimeout(() => this.session.write(session), SESSION_WRITE_DELAY_MS);
    });
    void this.refreshList();
  }

  document(id: string): WorkflowDocumentStore | null {
    return this.documents().get(id) ?? null;
  }

  focusGroup(groupId: string): void {
    if (findGroup(this.layout(), groupId)) this.activeGroupId.set(groupId);
  }

  activateTab(groupId: string, docId: string): void {
    this.layout.update((layout) => activateTab(layout, docId));
    this.focusGroup(groupId);
  }

  newCanvas(groupId = this.activeGroup().id): WorkflowDocumentStore {
    const document = this.createDocument();
    this.layout.update((layout) => addTab(layout, groupId, document.id));
    this.focusGroup(groupId);
    return document;
  }

  splitWithNewCanvas(groupId: string, edge: Exclude<DropEdge, 'center'>): void {
    const document = this.createDocument();
    this.placeTab(document.id, groupId, edge);
  }

  addBlock(kind: BlockKind): void {
    (this.activeDocument() ?? this.newCanvas()).addBlock(kind);
  }

  addBlockWithConfig(config: BlockConfig): void {
    (this.activeDocument() ?? this.newCanvas()).addBlockWithConfig(config);
  }

  moveTab(docId: string, groupId: string, edge: DropEdge): void {
    if (!this.documents().has(docId)) return;
    this.placeTab(docId, groupId, edge);
  }

  async openWorkflow(id: string, groupId = this.activeGroup().id, edge: DropEdge = 'center') {
    if (this.documents().has(id)) {
      const group = groupOf(this.layout(), id);
      if (group && edge === 'center') {
        this.activateTab(group.id, id);
      } else {
        this.placeTab(id, groupId, edge);
      }
      return;
    }

    try {
      const saved = await this.repository.get(id);
      this.register(this.toStore({ ...saved, dirty: false, persisted: true }));
      this.placeTab(id, groupId, edge);
    } catch (error) {
      this.listError.set((error as Error).message);
    }
  }

  closeTab(docId: string): void {
    const document = this.documents().get(docId);
    if (!document) return;
    if (document.dirty() && !this.confirm(`Discard unsaved changes to "${document.name()}"?`)) {
      return;
    }
    this.layout.update((layout) => closeTab(layout, docId));
    this.documents.update((documents) => {
      const next = new Map(documents);
      next.delete(docId);
      return next;
    });
    if (!findGroup(this.layout(), this.activeGroupId())) {
      this.activeGroupId.set(allGroups(this.layout())[0].id);
    }
  }

  resizeSplit(splitId: string, sizes: readonly number[]): void {
    this.layout.update((layout) => resizeSplit(layout, splitId, sizes));
  }

  async save(docId: string): Promise<void> {
    const document = this.documents().get(docId);
    if (!document || document.saving()) return;
    document.saving.set(true);
    try {
      const summary = await this.repository.save(document.toDocument());
      document.markSaved();
      this.workflows.update((workflows) => [
        summary,
        ...workflows.filter((workflow) => workflow.id !== summary.id),
      ]);
    } catch (error) {
      document.saveError.set((error as Error).message);
    } finally {
      document.saving.set(false);
    }
  }

  async deleteWorkflow(id: string): Promise<void> {
    const summary = this.workflows().find((workflow) => workflow.id === id);
    if (!this.confirm(`Delete "${summary?.name ?? UNTITLED_WORKFLOW}" from the database?`)) return;
    try {
      await this.repository.remove(id);
      this.workflows.update((workflows) => workflows.filter((workflow) => workflow.id !== id));
      this.documents().get(id)?.markUnpersisted();
    } catch (error) {
      this.listError.set((error as Error).message);
    }
  }

  async refreshList(): Promise<void> {
    this.listState.set('loading');
    this.listError.set(null);
    try {
      this.workflows.set(await this.repository.list());
      this.listState.set('ready');
    } catch (error) {
      this.listError.set((error as Error).message);
      this.listState.set('error');
    }
  }

  private placeTab(docId: string, groupId: string, edge: DropEdge): void {
    this.layout.update((layout) => moveTab(layout, docId, groupId, edge, this.newId));
    const group = groupOf(this.layout(), docId);
    if (group) this.activateTab(group.id, docId);
  }

  private restore(): void {
    const saved = this.session.read();
    if (saved && saved.documents.length > 0) {
      const stores = saved.documents.map((draft) => this.toStore(draft));
      const ids = new Set(stores.map((store) => store.id));
      let layout = saved.layout;
      for (const tab of openTabs(layout)) {
        if (!ids.has(tab)) layout = closeTab(layout, tab);
      }
      const open = new Set(openTabs(layout));
      this.documents.set(
        new Map(stores.filter((store) => open.has(store.id)).map((s) => [s.id, s])),
      );
      this.layout.set(layout);
      this.activeGroupId.set(
        findGroup(layout, saved.activeGroupId) ? saved.activeGroupId : allGroups(layout)[0].id,
      );
      if (open.size > 0) return;
    }

    const legacy = this.legacy.takeWorkflow();
    const document = this.createDocument(
      legacy ? { ...legacy, id: this.newId(), dirty: true, persisted: false } : undefined,
    );
    const group = createGroup(this.newId(), [document.id]);
    this.layout.set(group);
    this.activeGroupId.set(group.id);
  }

  private createDocument(draft?: DocumentDraft): WorkflowDocumentStore {
    const empty: WorkflowDocument = {
      id: this.newId(),
      name: UNTITLED_WORKFLOW,
      blocks: [],
      connections: [],
    };
    const store = this.toStore(draft ?? { ...empty, dirty: false, persisted: false });
    this.register(store);
    return store;
  }

  private register(store: WorkflowDocumentStore): void {
    this.documents.update((documents) => new Map(documents).set(store.id, store));
  }

  private toStore(draft: DocumentDraft): WorkflowDocumentStore {
    return new WorkflowDocumentStore(draft, this.executor, this.newId);
  }
}
