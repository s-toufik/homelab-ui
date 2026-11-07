import { Injectable, computed, inject, signal } from '@angular/core';
import { parse, stringify } from 'yaml';
import {
  type KubeObject,
  type ResourceKind,
  type ResourceRow,
  kindById,
  podState,
  toRow,
} from '../domain/resources';
import { KubeApiService, type Usage, parseMemory } from '../infrastructure/api/kube-api.service';

export type DetailTab = 'overview' | 'yaml' | 'logs' | 'shell' | 'events';

export interface NodeView {
  row: ResourceRow;
  usage: Usage | null;
  cpuCores: number;
  memoryBytes: number;
}

@Injectable({ providedIn: 'root' })
export class KubernetesStore {
  private readonly api = inject(KubeApiService);

  readonly view = signal<string>('overview');
  readonly namespace = signal('homelab');
  readonly namespaces = signal<string[]>([]);
  readonly search = signal('');
  readonly rows = signal<ResourceRow[]>([]);
  readonly podUsage = signal<Map<string, Usage>>(new Map());
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  readonly nodes = signal<NodeView[]>([]);
  readonly warnings = signal<ResourceRow[]>([]);
  readonly unhealthyPods = signal<ResourceRow[]>([]);
  readonly podCount = signal(0);

  readonly selected = signal<{ resource: ResourceKind; object: KubeObject } | null>(null);
  readonly detailTab = signal<DetailTab>('overview');
  readonly related = signal<ResourceRow[]>([]);
  readonly busy = signal(false);
  readonly actionError = signal<string | null>(null);
  readonly notice = signal<string | null>(null);

  readonly resource = computed(() => kindById(this.view()));
  readonly shown = computed(() => {
    const needle = this.search().trim().toLowerCase();
    const rows = needle
      ? this.rows().filter((row) =>
          `${row.namespace}/${row.name} ${row.status} ${row.details}`
            .toLowerCase()
            .includes(needle),
        )
      : this.rows();
    return this.view() === 'events' ? [...rows].sort((a, b) => b.createdMs - a.createdMs) : rows;
  });

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      if (this.namespaces().length === 0) {
        const list = await this.api.list(kindById('namespaces'), '');
        this.namespaces.set(list.map((ns) => ns.metadata.name).sort());
      }
      if (this.view() === 'overview') await this.loadOverview();
      else await this.loadRows();
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  private async loadRows(): Promise<void> {
    const resource = this.resource();
    const objects = await this.api.list(resource, this.namespace());
    this.rows.set(
      objects
        .map((object) => toRow(resource, object))
        .sort((a, b) => a.namespace.localeCompare(b.namespace) || a.name.localeCompare(b.name)),
    );
    if (resource.id === 'pods') {
      this.podUsage.set(await this.api.podUsage(this.namespace()).catch(() => new Map()));
    }
  }

  private async loadOverview(): Promise<void> {
    const [nodes, usage, events, pods] = await Promise.all([
      this.api.list(kindById('nodes'), ''),
      this.api.nodeUsage().catch(() => new Map<string, Usage>()),
      this.api.list(kindById('events'), '', '?fieldSelector=type%3DWarning'),
      this.api.list(kindById('pods'), ''),
    ]);
    this.nodes.set(
      nodes.map((node) => ({
        row: toRow(kindById('nodes'), node),
        usage: usage.get(node.metadata.name) ?? null,
        cpuCores: Number(node.status?.['allocatable']?.cpu ?? node.status?.['capacity']?.cpu ?? 0),
        memoryBytes: parseMemory(node.status?.['allocatable']?.memory ?? '0'),
      })),
    );
    const hourAgo = Date.now() - 3600_000;
    this.warnings.set(
      events
        .map((event) => toRow(kindById('events'), event))
        .filter((row) => row.createdMs >= hourAgo)
        .sort((a, b) => b.createdMs - a.createdMs)
        .slice(0, 30),
    );
    this.podCount.set(pods.length);
    this.unhealthyPods.set(
      pods
        .filter((pod) => {
          const state = podState(pod);
          return state.tone === 'bad' || state.tone === 'warn';
        })
        .map((pod) => toRow(kindById('pods'), pod)),
    );
  }

  show(view: string): void {
    this.view.set(view);
    this.search.set('');
    this.close();
    void this.load();
  }

  async open(resource: ResourceKind, row: ResourceRow): Promise<void> {
    this.actionError.set(null);
    this.notice.set(null);
    this.detailTab.set('overview');
    this.selected.set({ resource, object: row.object });
    await this.refreshSelected();
  }

  close(): void {
    this.selected.set(null);
    this.related.set([]);
  }

  async refreshSelected(): Promise<void> {
    const current = this.selected();
    if (!current) return;
    try {
      const object = await this.api.get(
        current.resource,
        current.object.metadata.name,
        current.object.metadata.namespace,
      );
      this.selected.set({ resource: current.resource, object });
      if (current.resource.namespaced && current.resource.id !== 'events') {
        const events = await this.api.list(
          kindById('events'),
          object.metadata.namespace ?? '',
          `?fieldSelector=${encodeURIComponent(`involvedObject.name=${object.metadata.name}`)}`,
        );
        this.related.set(
          events
            .map((event) => toRow(kindById('events'), event))
            .sort((a, b) => b.createdMs - a.createdMs),
        );
      }
    } catch (error) {
      this.actionError.set((error as Error).message);
    }
  }

  yaml(object: KubeObject): string {
    const { managedFields: _managed, ...metadata } = object.metadata;
    return stringify({ ...object, metadata });
  }

  async saveYaml(text: string): Promise<boolean> {
    const current = this.selected();
    if (!current) return false;
    return this.act('Saved.', async () => {
      const object = parse(text) as KubeObject;
      await this.api.replace(current.resource, object);
    });
  }

  scale(replicas: number): Promise<boolean> {
    const current = this.selected();
    if (!current) return Promise.resolve(false);
    const { name, namespace } = current.object.metadata;
    return this.act(`Scaled to ${replicas}.`, () =>
      this.api.scale(current.resource, name, namespace ?? '', replicas),
    );
  }

  restart(): Promise<boolean> {
    const current = this.selected();
    if (!current) return Promise.resolve(false);
    const { name, namespace } = current.object.metadata;
    return this.act('Restarting: new pods replace the old ones.', () =>
      this.api.restart(current.resource, name, namespace ?? ''),
    );
  }

  suspend(suspend: boolean): Promise<boolean> {
    const current = this.selected();
    if (!current) return Promise.resolve(false);
    const { name, namespace } = current.object.metadata;
    return this.act(suspend ? 'Suspended.' : 'Resumed.', () =>
      this.api.suspend(name, namespace ?? '', suspend),
    );
  }

  runNow(): Promise<boolean> {
    const current = this.selected();
    if (!current) return Promise.resolve(false);
    return this.act('Job started.', async () => {
      const job = await this.api.runNow(current.object);
      this.notice.set(`Job ${job} started.`);
    });
  }

  async remove(): Promise<boolean> {
    const current = this.selected();
    if (!current) return false;
    const { name, namespace } = current.object.metadata;
    const done = await this.act('Deleted.', () =>
      this.api.remove(current.resource, name, namespace),
    );
    if (done) this.close();
    return done;
  }

  private async act(notice: string, action: () => Promise<void>): Promise<boolean> {
    this.busy.set(true);
    this.actionError.set(null);
    this.notice.set(null);
    try {
      await action();
      this.notice.set(this.notice() ?? notice);
      await Promise.all([this.refreshSelected(), this.load()]);
      return true;
    } catch (error) {
      this.actionError.set((error as Error).message);
      return false;
    } finally {
      this.busy.set(false);
    }
  }
}
