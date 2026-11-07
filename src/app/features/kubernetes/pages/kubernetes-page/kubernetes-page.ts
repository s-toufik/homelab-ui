import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { formatBytes } from '@shared/ui/charts/chart-format';
import { Gauge } from '@shared/ui/charts/gauge';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { KubernetesStore } from '../../application/kubernetes.store';
import { ObjectDetail } from '../../components/object-detail/object-detail';
import {
  RESOURCE_KINDS,
  type ResourceGroup,
  type ResourceRow,
  kindById,
} from '../../domain/resources';

const GROUPS: ResourceGroup[] = ['Workloads', 'Network', 'Config and storage', 'Cluster'];

@Component({
  selector: 'app-kubernetes-page',
  imports: [FormsModule, DatePipe, PageHeader, Gauge, ObjectDetail],
  templateUrl: './kubernetes-page.html',
  styleUrl: './kubernetes-page.scss',
})
export class KubernetesPage {
  protected readonly store = inject(KubernetesStore);
  protected readonly isAdmin = inject(GatewaySession).isAdmin;
  protected readonly bytes = formatBytes;
  protected readonly groups = GROUPS.map((group) => ({
    group,
    kinds: RESOURCE_KINDS.filter((kind) => kind.group === group),
  }));

  constructor() {
    if (this.isAdmin()) void this.store.load();
  }

  protected openPod(row: ResourceRow): void {
    void this.store.open(kindById('pods'), row);
  }

  protected openEvent(row: ResourceRow): void {
    void this.store.open(kindById('events'), row);
  }

  protected setNamespace(namespace: string): void {
    this.store.namespace.set(namespace);
    this.store.close();
    void this.store.load();
  }

  protected usage(row: ResourceRow): string {
    const usage = this.store.podUsage().get(`${row.namespace}/${row.name}`);
    if (!usage) return '';
    return `${Math.round(usage.cpuCores * 1000)}m · ${formatBytes(usage.memoryBytes)}`;
  }

  protected age(createdMs: number): string {
    const seconds = Math.max((Date.now() - createdMs) / 1000, 0);
    if (seconds < 120) return `${Math.round(seconds)}s`;
    if (seconds < 7200) return `${Math.round(seconds / 60)}m`;
    if (seconds < 172_800) return `${Math.round(seconds / 3600)}h`;
    return `${Math.round(seconds / 86_400)}d`;
  }
}
