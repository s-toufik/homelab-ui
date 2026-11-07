import { Injectable, inject } from '@angular/core';
import { GatewayApi } from '@shared/infrastructure/gateway-api';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import {
  type KubeObject,
  type ResourceKind,
  collectionPath,
  kindById,
  objectPath,
} from '../../domain/resources';
import KUBE from '../kube.json';

interface ListResponse {
  items: KubeObject[];
}

interface MetricsList {
  items: {
    metadata: { name: string; namespace?: string };
    usage?: { cpu: string; memory: string };
    containers?: { usage: { cpu: string; memory: string } }[];
  }[];
}

export interface Usage {
  cpuCores: number;
  memoryBytes: number;
}

const MERGE_PATCH = 'application/merge-patch+json';

export function parseCpu(value: string): number {
  if (value.endsWith('n')) return Number(value.slice(0, -1)) / 1e9;
  if (value.endsWith('u')) return Number(value.slice(0, -1)) / 1e6;
  if (value.endsWith('m')) return Number(value.slice(0, -1)) / 1e3;
  return Number(value);
}

export function parseMemory(value: string): number {
  const match = /^([0-9.]+)([a-zA-Z]*)$/.exec(value);
  if (!match) return 0;
  const units: Record<string, number> = {
    '': 1,
    k: 1e3,
    M: 1e6,
    G: 1e9,
    T: 1e12,
    Ki: 1024,
    Mi: 1024 ** 2,
    Gi: 1024 ** 3,
    Ti: 1024 ** 4,
  };
  return Number(match[1]) * (units[match[2]] ?? 1);
}

export function cronJobRun(cronJob: KubeObject, now = Date.now()): KubeObject {
  const template = cronJob.spec?.['jobTemplate'] ?? {};
  return {
    apiVersion: 'batch/v1',
    kind: 'Job',
    metadata: {
      name: `${cronJob.metadata.name}-manual-${Math.floor(now / 1000)}`.slice(0, 63),
      namespace: cronJob.metadata.namespace,
      labels: template.metadata?.labels,
      annotations: { 'cronjob.kubernetes.io/instantiate': 'manual' },
      ownerReferences: [
        {
          apiVersion: 'batch/v1',
          kind: 'CronJob',
          name: cronJob.metadata.name,
          uid: cronJob.metadata.uid,
          controller: true,
        } as never,
      ],
    },
    spec: template.spec,
  };
}

@Injectable({ providedIn: 'root' })
export class KubeApiService {
  private readonly api = inject(GatewayApi);
  private readonly server = inject(HomelabServer);

  url(path: string): string {
    return this.server.api(KUBE, path);
  }

  async list(resource: ResourceKind, namespace: string, query = ''): Promise<KubeObject[]> {
    const body = await this.api.json<ListResponse>(
      this.url(`${collectionPath(resource, namespace)}${query}`),
    );
    return body.items ?? [];
  }

  async get(resource: ResourceKind, name: string, namespace?: string): Promise<KubeObject> {
    return this.api.json<KubeObject>(this.url(objectPath(resource, name, namespace)));
  }

  async replace(resource: ResourceKind, object: KubeObject): Promise<KubeObject> {
    return this.api.json<KubeObject>(
      this.url(objectPath(resource, object.metadata.name, object.metadata.namespace)),
      {
        method: 'PUT',
        body: object,
      },
    );
  }

  async remove(resource: ResourceKind, name: string, namespace?: string): Promise<void> {
    await this.api.json(this.url(objectPath(resource, name, namespace)), {
      method: 'DELETE',
      body: { propagationPolicy: 'Background' },
    });
  }

  async patch(
    resource: ResourceKind,
    name: string,
    namespace: string | undefined,
    patch: unknown,
    subresource = '',
  ): Promise<void> {
    await this.api.json(this.url(`${objectPath(resource, name, namespace)}${subresource}`), {
      method: 'PATCH',
      body: JSON.stringify(patch),
      contentType: MERGE_PATCH,
    });
  }

  scale(resource: ResourceKind, name: string, namespace: string, replicas: number): Promise<void> {
    return this.patch(resource, name, namespace, { spec: { replicas } }, '/scale');
  }

  restart(resource: ResourceKind, name: string, namespace: string): Promise<void> {
    return this.patch(resource, name, namespace, {
      spec: {
        template: {
          metadata: {
            annotations: { 'kubectl.kubernetes.io/restartedAt': new Date().toISOString() },
          },
        },
      },
    });
  }

  suspend(name: string, namespace: string, suspend: boolean): Promise<void> {
    return this.patch(kindById('cronjobs'), name, namespace, { spec: { suspend } });
  }

  async runNow(cronJob: KubeObject): Promise<string> {
    const job = cronJobRun(cronJob);
    await this.api.json(
      this.url(
        `/apis/batch/v1/namespaces/${encodeURIComponent(job.metadata.namespace ?? '')}/jobs`,
      ),
      {
        method: 'POST',
        body: job,
      },
    );
    return job.metadata.name;
  }

  async logs(
    namespace: string,
    pod: string,
    container: string,
    previous: boolean,
    tailLines = 1000,
  ): Promise<string> {
    const params = new URLSearchParams({
      container,
      tailLines: `${tailLines}`,
      timestamps: 'true',
    });
    if (previous) params.set('previous', 'true');
    return this.api.text(
      this.url(
        `/api/v1/namespaces/${encodeURIComponent(namespace)}/pods/${encodeURIComponent(pod)}/log?${params}`,
      ),
      {
        accept: 'text/plain',
      },
    );
  }

  async followLogs(
    namespace: string,
    pod: string,
    container: string,
    onChunk: (text: string) => void,
    signal: AbortSignal,
  ): Promise<void> {
    const params = new URLSearchParams({
      container,
      tailLines: '200',
      follow: 'true',
      timestamps: 'true',
    });
    const response = await this.api.send(
      this.url(
        `/api/v1/namespaces/${encodeURIComponent(namespace)}/pods/${encodeURIComponent(pod)}/log?${params}`,
      ),
      { accept: 'text/plain', signal, timeoutMs: 24 * 3600_000 },
    );
    const reader = response.body?.getReader();
    if (!reader) return;
    const decoder = new TextDecoder();
    for (;;) {
      const { done, value } = await reader.read();
      if (done) return;
      onChunk(decoder.decode(value, { stream: true }));
    }
  }

  async nodeUsage(): Promise<Map<string, Usage>> {
    const body = await this.api.json<MetricsList>(this.url('/apis/metrics.k8s.io/v1beta1/nodes'));
    return new Map(
      body.items.map((item) => [
        item.metadata.name,
        {
          cpuCores: parseCpu(item.usage?.cpu ?? '0'),
          memoryBytes: parseMemory(item.usage?.memory ?? '0'),
        },
      ]),
    );
  }

  async podUsage(namespace: string): Promise<Map<string, Usage>> {
    const scope = namespace ? `/namespaces/${encodeURIComponent(namespace)}` : '';
    const body = await this.api.json<MetricsList>(
      this.url(`/apis/metrics.k8s.io/v1beta1${scope}/pods`),
    );
    return new Map(
      body.items.map((item) => [
        `${item.metadata.namespace}/${item.metadata.name}`,
        (item.containers ?? []).reduce<Usage>(
          (sum, container) => ({
            cpuCores: sum.cpuCores + parseCpu(container.usage.cpu),
            memoryBytes: sum.memoryBytes + parseMemory(container.usage.memory),
          }),
          { cpuCores: 0, memoryBytes: 0 },
        ),
      ]),
    );
  }

  execUrl(namespace: string, pod: string, container: string): string {
    const params = new URLSearchParams({
      container,
      stdin: 'true',
      stdout: 'true',
      stderr: 'true',
      tty: 'true',
    });
    for (const part of ['sh', '-c', 'command -v bash >/dev/null && exec bash || exec sh'])
      params.append('command', part);
    const path = this.url(
      `/api/v1/namespaces/${encodeURIComponent(namespace)}/pods/${encodeURIComponent(pod)}/exec?${params}`,
    );
    const absolute = new URL(path, location.href);
    absolute.protocol = absolute.protocol === 'https:' ? 'wss:' : 'ws:';
    return absolute.toString();
  }
}
