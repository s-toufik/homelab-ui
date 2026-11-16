import type { KubeObject } from '@features/kubernetes/domain/resources';
import { neighbours } from './map-layout';
import { serviceStatus } from './service-status';

const NOW = Date.parse('2026-11-16T18:00:00Z');

function pod(
  instance: string,
  extra: Partial<KubeObject['status']> = {},
  labels: Record<string, string> = {},
): KubeObject {
  return {
    metadata: {
      name: `${instance}-x`,
      labels: { 'app.kubernetes.io/instance': instance, ...labels },
      creationTimestamp: '2026-11-16T03:00:00Z',
    },
    spec: { containers: [{ image: `${instance}:1.0` }] },
    status: { phase: 'Running', containerStatuses: [{ ready: true, restartCount: 0 }], ...extra },
  };
}

describe('service status from pods', () => {
  it('is ready when every pod of the release is', () => {
    expect(
      serviceStatus('caddy', 'Deployment', [pod('caddy'), pod('keycloak')], NOW),
    ).toMatchObject({
      state: 'ok',
      count: '1/1',
      image: 'caddy:1.0',
    });
  });

  it('needs a look when a container restarted in the last day, and fails when a pod is not ready', () => {
    const restarted = pod('agent-coding', {
      containerStatuses: [
        {
          ready: true,
          restartCount: 2,
          lastState: { terminated: { finishedAt: '2026-11-16T15:00:00Z' } },
        },
      ],
    });
    expect(
      serviceStatus('agents', 'Deployments', [pod('agent-kitchen'), restarted], NOW),
    ).toMatchObject({
      state: 'warn',
      count: '2/2',
    });
    expect(
      serviceStatus(
        'kafka',
        'StatefulSet',
        [pod('kafka', { phase: 'Pending', containerStatuses: [] })],
        NOW,
      ).state,
    ).toBe('fail');
  });

  it("leaves a release's job pods out of its count, and warns when the last one failed", () => {
    const job = (phase: string, created: string): KubeObject => ({
      ...pod('keycloak', { phase, containerStatuses: [{ ready: false, restartCount: 0 }] }),
      metadata: {
        name: `keycloak-sync-${phase}`,
        labels: { 'app.kubernetes.io/instance': 'keycloak' },
        creationTimestamp: created,
        ownerReferences: [{ kind: 'Job', name: 'keycloak-sync' }],
      },
    });
    const done = job('Succeeded', '2026-11-16T10:00:00Z');
    expect(serviceStatus('keycloak', 'Deployment', [pod('keycloak'), done], NOW)).toMatchObject({
      state: 'ok',
      count: '1/1',
    });
    const failed = job('Failed', '2026-11-16T12:00:00Z');
    const status = serviceStatus('keycloak', 'Deployment', [pod('keycloak'), done, failed], NOW);
    expect(status).toMatchObject({ state: 'warn', count: '1/1' });
    expect(status.label).toContain('keycloak-sync failed');
  });

  it("reads a job's last run, and finds postgres by its CloudNativePG label", () => {
    expect(
      serviceStatus('backups', 'CronJob', [pod('backups', { phase: 'Failed' })], NOW).state,
    ).toBe('fail');
    expect(
      serviceStatus('db-migrate', 'Job', [pod('db-migrate', { phase: 'Succeeded' })], NOW).state,
    ).toBe('done');
    expect(
      serviceStatus('postgres', 'Cluster', [pod('x', {}, { 'cnpg.io/cluster': 'postgres' })], NOW)
        .state,
    ).toBe('ok');
    expect(serviceStatus('tempo', 'Deployment', [], NOW).state).toBe('unknown');
  });

  it('knows what each service talks to and what uses it', () => {
    expect(neighbours('backups')).toEqual({ out: ['postgres', 'mongodb'], used: [] });
    expect(neighbours('keycloak').used).toEqual(['caddy', 'oauth2-proxy']);
  });
});
