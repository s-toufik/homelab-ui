import { DestroyRef, Injectable, computed, inject, signal } from '@angular/core';
import { ControlCenterStore } from '@features/control-center/application/control-center.store';
import { kindById, type KubeObject } from '@features/kubernetes/domain/resources';
import { KubeApiService } from '@features/kubernetes/infrastructure/api/kube-api.service';
import { CATEGORIES, serviceById } from '../domain/map-layout';
import { serviceStatus, type ServiceStatus } from '../domain/service-status';

const NAMESPACE = 'homelab';
const REFRESH_MS = 30_000;
const RESTARTABLE = new Set(['Deployment', 'StatefulSet', 'DaemonSet']);

@Injectable({ providedIn: 'root' })
export class MapStore {
  private readonly kube = inject(KubeApiService);
  readonly node = inject(ControlCenterStore);

  readonly pods = signal<KubeObject[]>([]);
  readonly error = signal<string | null>(null);
  readonly updatedAt = signal<Date | null>(null);
  readonly selected = signal<string | null>(null);
  readonly restarting = signal<string | null>(null);
  private timer: ReturnType<typeof setInterval> | null = null;

  readonly statuses = computed(() => {
    const pods = this.pods();
    const now = Date.now();
    const result: Record<string, ServiceStatus> = {};
    for (const service of CATEGORIES.flatMap((category) => category.services)) {
      result[service.id] = serviceStatus(service.id, service.workload, pods, now);
    }
    return result;
  });

  readonly summary = computed(() => {
    const pods = this.pods().filter((pod) => pod.status?.['phase'] !== 'Succeeded');
    const ready = pods.filter((pod) =>
      (pod.status?.['containerStatuses'] ?? []).every((c: { ready: boolean }) => c.ready),
    ).length;
    const failed = Object.values(this.statuses()).filter(
      (status) => status.state === 'fail',
    ).length;
    return { pods: pods.length, ready, failed };
  });

  constructor() {
    inject(DestroyRef).onDestroy(() => this.stop());
  }

  start(): void {
    this.node.start();
    if (this.timer) return;
    void this.refresh();
    this.timer = setInterval(() => void this.refresh(), REFRESH_MS);
  }

  stop(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  async refresh(): Promise<void> {
    try {
      this.pods.set(await this.kube.list(kindById('pods'), NAMESPACE));
      this.error.set(null);
      this.updatedAt.set(new Date());
    } catch (error) {
      this.error.set(`Couldn't read the cluster: ${(error as Error).message}`);
    }
  }

  canRestart(id: string): boolean {
    return RESTARTABLE.has(serviceById(id)?.workload ?? '');
  }

  async restart(id: string): Promise<void> {
    const service = serviceById(id);
    if (!service || !this.canRestart(id)) return;
    this.restarting.set(id);
    try {
      await this.kube.restart(kindById(`${service.workload.toLowerCase()}s`), id, NAMESPACE);
      await this.refresh();
    } catch (error) {
      this.error.set(`Couldn't restart ${id}: ${(error as Error).message}`);
    } finally {
      this.restarting.set(null);
    }
  }
}
