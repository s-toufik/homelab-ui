import type { KubeObject } from '@features/kubernetes/domain/resources';
import { AGENT_RELEASES } from './map-layout';

export type ServiceState = 'ok' | 'warn' | 'fail' | 'done' | 'unknown';

export interface ServiceStatus {
  readonly state: ServiceState;
  readonly label: string;
  readonly count: string;
  readonly image: string;
  readonly restartsToday: number;
}

const DAY = 86_400_000;
const INSTANCE = 'app.kubernetes.io/instance';

export function podsOf(id: string, pods: readonly KubeObject[]): KubeObject[] {
  const labels = (pod: KubeObject) => pod.metadata.labels ?? {};
  if (id === 'postgres') return pods.filter((pod) => labels(pod)['cnpg.io/cluster'] === 'postgres');
  if (id === 'agents') return pods.filter((pod) => AGENT_RELEASES.includes(labels(pod)[INSTANCE]));
  return pods.filter((pod) => labels(pod)[INSTANCE] === id);
}

function containers(pod: KubeObject): any[] {
  return pod.status?.['containerStatuses'] ?? [];
}

function isReady(pod: KubeObject): boolean {
  const list = containers(pod);
  return pod.status?.['phase'] === 'Running' && list.length > 0 && list.every((c) => c.ready);
}

function recentRestarts(pod: KubeObject, now: number): number {
  return containers(pod).filter((c) => {
    const finished = Date.parse(c.lastState?.terminated?.finishedAt ?? '');
    return (c.restartCount ?? 0) > 0 && Number.isFinite(finished) && now - finished < DAY;
  }).length;
}

function isJobPod(pod: KubeObject): boolean {
  return (pod.metadata.ownerReferences ?? []).some((owner) => owner.kind === 'Job');
}

function jobName(pod: KubeObject): string {
  return pod.metadata.ownerReferences?.find((owner) => owner.kind === 'Job')?.name ?? 'a job';
}

function newest(pods: readonly KubeObject[]): KubeObject | undefined {
  return [...pods].sort((a, b) =>
    (b.metadata.creationTimestamp ?? '').localeCompare(a.metadata.creationTimestamp ?? ''),
  )[0];
}

function time(value: string | undefined): string {
  const date = new Date(value ?? '');
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function serviceStatus(
  id: string,
  kind: string,
  pods: readonly KubeObject[],
  now = Date.now(),
): ServiceStatus {
  const own = podsOf(id, pods);
  const image =
    (own.find((pod) => !isJobPod(pod)) ?? own[0])?.spec?.['containers']?.[0]?.image ?? '';
  if (!own.length)
    return { state: 'unknown', label: 'no pod found', count: '–', image, restartsToday: 0 };

  if (kind === 'CronJob' || kind === 'Job') {
    const latest = newest(own)!;
    const phase = latest.status?.['phase'];
    const at = time(latest.status?.['startTime'] ?? latest.metadata.creationTimestamp);
    if (phase === 'Failed')
      return {
        state: 'fail',
        label: `last run failed at ${at}`,
        count: 'failed',
        image,
        restartsToday: 0,
      };
    if (phase === 'Succeeded')
      return {
        state: 'done',
        label: `last run succeeded at ${at}`,
        count: 'done',
        image,
        restartsToday: 0,
      };
    return { state: 'ok', label: 'running now', count: 'running', image, restartsToday: 0 };
  }

  const jobs = own.filter(isJobPod);
  const workload = own.filter((pod) => !isJobPod(pod));
  const ready = workload.filter(isReady).length;
  const restartsToday = workload.reduce((sum, pod) => sum + recentRestarts(pod, now), 0);
  const count = `${ready}/${workload.length}`;
  if (ready < workload.length)
    return { state: 'fail', label: `${count} ready`, count, image, restartsToday };
  const lastJob = newest(jobs);
  if (lastJob?.status?.['phase'] === 'Failed') {
    return {
      state: 'warn',
      label: `${count} ready · ${jobName(lastJob)} failed at ${time(lastJob.status?.['startTime'])}`,
      count,
      image,
      restartsToday,
    };
  }
  if (restartsToday) {
    return {
      state: 'warn',
      label: `${count} ready · restarted ${restartsToday}× today`,
      count,
      image,
      restartsToday,
    };
  }
  return { state: 'ok', label: `${count} ready`, count, image, restartsToday };
}
