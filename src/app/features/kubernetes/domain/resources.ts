export type ResourceGroup = 'Workloads' | 'Network' | 'Config and storage' | 'Cluster';
export type Tone = 'ok' | 'warn' | 'bad' | 'muted';

export interface ResourceKind {
  id: string;
  label: string;
  group: ResourceGroup;
  apiBase: string;
  plural: string;
  namespaced: boolean;
  kind: string;
  apiVersion: string;
}

export interface KubeObject {
  apiVersion?: string;
  kind?: string;
  metadata: {
    name: string;
    namespace?: string;
    uid?: string;
    creationTimestamp?: string;
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
    ownerReferences?: { kind: string; name: string }[];
    resourceVersion?: string;
    managedFields?: unknown;
  };
  spec?: Record<string, any>;
  status?: Record<string, any>;
  data?: Record<string, string>;
  type?: string;
  [key: string]: any;
}

export interface ResourceRow {
  name: string;
  namespace: string;
  status: string;
  tone: Tone;
  details: string;
  createdMs: number;
  object: KubeObject;
}

const kind = (
  id: string,
  label: string,
  group: ResourceGroup,
  apiVersion: string,
  kindName: string,
  namespaced = true,
): ResourceKind => ({
  id,
  label,
  group,
  apiBase: apiVersion === 'v1' ? '/api/v1' : `/apis/${apiVersion}`,
  plural: id,
  namespaced,
  kind: kindName,
  apiVersion,
});

export const RESOURCE_KINDS: readonly ResourceKind[] = [
  kind('pods', 'Pods', 'Workloads', 'v1', 'Pod'),
  kind('deployments', 'Deployments', 'Workloads', 'apps/v1', 'Deployment'),
  kind('statefulsets', 'StatefulSets', 'Workloads', 'apps/v1', 'StatefulSet'),
  kind('daemonsets', 'DaemonSets', 'Workloads', 'apps/v1', 'DaemonSet'),
  kind('cronjobs', 'CronJobs', 'Workloads', 'batch/v1', 'CronJob'),
  kind('jobs', 'Jobs', 'Workloads', 'batch/v1', 'Job'),
  kind('services', 'Services', 'Network', 'v1', 'Service'),
  kind('networkpolicies', 'Network policies', 'Network', 'networking.k8s.io/v1', 'NetworkPolicy'),
  kind('configmaps', 'ConfigMaps', 'Config and storage', 'v1', 'ConfigMap'),
  kind('secrets', 'Secrets', 'Config and storage', 'v1', 'Secret'),
  kind(
    'persistentvolumeclaims',
    'Volume claims',
    'Config and storage',
    'v1',
    'PersistentVolumeClaim',
  ),
  kind('events', 'Events', 'Cluster', 'v1', 'Event'),
  kind('nodes', 'Nodes', 'Cluster', 'v1', 'Node', false),
  kind('namespaces', 'Namespaces', 'Cluster', 'v1', 'Namespace', false),
  kind('persistentvolumes', 'Volumes', 'Cluster', 'v1', 'PersistentVolume', false),
];

export function kindById(id: string): ResourceKind {
  return RESOURCE_KINDS.find((entry) => entry.id === id) ?? RESOURCE_KINDS[0];
}

export function collectionPath(resource: ResourceKind, namespace: string): string {
  const scope =
    resource.namespaced && namespace ? `/namespaces/${encodeURIComponent(namespace)}` : '';
  return `${resource.apiBase}${scope}/${resource.plural}`;
}

export function objectPath(resource: ResourceKind, name: string, namespace?: string): string {
  const scope =
    resource.namespaced && namespace ? `/namespaces/${encodeURIComponent(namespace)}` : '';
  return `${resource.apiBase}${scope}/${resource.plural}/${encodeURIComponent(name)}`;
}

function readyTone(ready: number, wanted: number): Tone {
  if (wanted === 0) return 'muted';
  return ready >= wanted ? 'ok' : ready === 0 ? 'bad' : 'warn';
}

export function podState(pod: KubeObject): {
  status: string;
  tone: Tone;
  ready: string;
  restarts: number;
} {
  const statuses: any[] = pod.status?.['containerStatuses'] ?? [];
  const restarts = statuses.reduce((sum, s) => sum + (s.restartCount ?? 0), 0);
  const readyCount = statuses.filter((s) => s.ready).length;
  const ready = `${readyCount}/${(pod.spec?.['containers'] ?? []).length}`;
  if ((pod.metadata as Record<string, unknown>)['deletionTimestamp']) {
    return { status: 'Terminating', tone: 'warn', ready, restarts };
  }
  const waiting = statuses.find((s) => s.state?.waiting)?.state.waiting.reason as
    string | undefined;
  const terminated = statuses.find((s) => s.state?.terminated && !s.ready)?.state.terminated
    .reason as string | undefined;
  const phase: string = pod.status?.['phase'] ?? 'Unknown';
  const status = waiting ?? (phase === 'Running' ? phase : (terminated ?? phase));
  const tone: Tone =
    phase === 'Succeeded'
      ? 'muted'
      : waiting && /BackOff|Err|Invalid/.test(waiting)
        ? 'bad'
        : phase === 'Failed'
          ? 'bad'
          : phase === 'Running' && readyCount === statuses.length
            ? 'ok'
            : 'warn';
  return { status, tone, ready, restarts };
}

export function toRow(resource: ResourceKind, object: KubeObject): ResourceRow {
  const base = {
    name: object.metadata.name,
    namespace: object.metadata.namespace ?? '',
    createdMs: Date.parse(object.metadata.creationTimestamp ?? '') || 0,
    object,
  };
  const spec = object.spec ?? {};
  const status = object.status ?? {};
  switch (resource.id) {
    case 'pods': {
      const state = podState(object);
      return {
        ...base,
        status: state.status,
        tone: state.tone,
        details: `${state.ready} ready · ${state.restarts} restarts · ${spec['nodeName'] ?? ''}`,
      };
    }
    case 'deployments':
    case 'statefulsets': {
      const wanted = spec['replicas'] ?? 0;
      const ready = status['readyReplicas'] ?? 0;
      return {
        ...base,
        status: `${ready}/${wanted} ready`,
        tone: readyTone(ready, wanted),
        details: images(object),
      };
    }
    case 'daemonsets': {
      const wanted = status['desiredNumberScheduled'] ?? 0;
      const ready = status['numberReady'] ?? 0;
      return {
        ...base,
        status: `${ready}/${wanted} ready`,
        tone: readyTone(ready, wanted),
        details: images(object),
      };
    }
    case 'cronjobs': {
      const last = status['lastScheduleTime']
        ? `last ${new Date(status['lastScheduleTime']).toLocaleString()}`
        : 'never ran';
      return {
        ...base,
        status: spec['suspend'] ? 'Suspended' : 'Scheduled',
        tone: spec['suspend'] ? 'muted' : 'ok',
        details: `${spec['schedule']} · ${last}`,
      };
    }
    case 'jobs': {
      const failed = status['failed'] ?? 0;
      const succeeded = status['succeeded'] ?? 0;
      const done = (status['conditions'] ?? []).find((c: any) => c.status === 'True')?.type as
        string | undefined;
      return {
        ...base,
        status: done ?? (status['active'] ? 'Running' : 'Pending'),
        tone: done === 'Failed' ? 'bad' : done === 'Complete' ? 'ok' : 'warn',
        details: `${succeeded} succeeded · ${failed} failed`,
      };
    }
    case 'services': {
      const ports = (spec['ports'] ?? [])
        .map((p: any) => `${p.port}${p.nodePort ? ':' + p.nodePort : ''}/${p.protocol ?? 'TCP'}`)
        .join(', ');
      return {
        ...base,
        status: spec['type'] ?? 'ClusterIP',
        tone: 'muted',
        details: `${spec['clusterIP'] ?? ''} · ${ports}`,
      };
    }
    case 'persistentvolumeclaims':
      return {
        ...base,
        status: status['phase'] ?? '',
        tone: status['phase'] === 'Bound' ? 'ok' : 'warn',
        details: `${status['capacity']?.storage ?? spec['resources']?.requests?.storage ?? ''} · ${spec['storageClassName'] ?? ''} · ${spec['volumeName'] ?? ''}`,
      };
    case 'persistentvolumes':
      return {
        ...base,
        status: status['phase'] ?? '',
        tone: status['phase'] === 'Bound' ? 'ok' : 'muted',
        details: `${spec['capacity']?.storage ?? ''} · ${spec['claimRef'] ? spec['claimRef'].namespace + '/' + spec['claimRef'].name : ''}`,
      };
    case 'configmaps':
      return {
        ...base,
        status: `${Object.keys(object.data ?? {}).length} keys`,
        tone: 'muted',
        details: Object.keys(object.data ?? {}).join(', '),
      };
    case 'secrets':
      return {
        ...base,
        status: `${Object.keys(object.data ?? {}).length} keys`,
        tone: 'muted',
        details: `${object.type ?? ''} · ${Object.keys(object.data ?? {}).join(', ')}`,
      };
    case 'events': {
      const involved = object['involvedObject'] ?? {};
      const when =
        object['lastTimestamp'] ?? object['eventTime'] ?? object.metadata.creationTimestamp;
      return {
        ...base,
        createdMs: Date.parse(when ?? '') || base.createdMs,
        status: `${object['type']} ${object['reason']}`,
        tone: object['type'] === 'Warning' ? 'warn' : 'muted',
        details: `${involved.kind}/${involved.name}: ${object['message'] ?? ''}${(object['count'] ?? 1) > 1 ? ` (×${object['count']})` : ''}`,
      };
    }
    case 'nodes': {
      const ready = (status['conditions'] ?? []).find((c: any) => c.type === 'Ready');
      return {
        ...base,
        status: ready?.status === 'True' ? 'Ready' : 'Not ready',
        tone: ready?.status === 'True' ? 'ok' : 'bad',
        details: `${status['nodeInfo']?.kubeletVersion ?? ''} · ${status['capacity']?.cpu ?? '?'} CPU · ${status['capacity']?.memory ?? '?'}`,
      };
    }
    case 'namespaces':
      return {
        ...base,
        status: status['phase'] ?? '',
        tone: status['phase'] === 'Active' ? 'ok' : 'warn',
        details: '',
      };
    default:
      return { ...base, status: '', tone: 'muted', details: '' };
  }
}

function images(object: KubeObject): string {
  const containers: any[] = object.spec?.['template']?.spec?.containers ?? [];
  return containers.map((c) => c.image).join(', ');
}

export function canScale(resource: ResourceKind): boolean {
  return resource.id === 'deployments' || resource.id === 'statefulsets';
}

export function canRestart(resource: ResourceKind): boolean {
  return canScale(resource) || resource.id === 'daemonsets';
}
