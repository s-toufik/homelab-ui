import { kindById, podState, toRow } from '../../domain/resources';
import { cronJobRun, parseCpu, parseMemory } from './kube-api.service';

describe('Kubernetes API helpers', () => {
  it('parses CPU and memory quantities', () => {
    expect(parseCpu('250m')).toBe(0.25);
    expect(parseCpu('1500000n')).toBeCloseTo(0.0015);
    expect(parseMemory('512Mi')).toBe(512 * 1024 * 1024);
    expect(parseMemory('2G')).toBe(2e9);
  });

  it('reads a crash-looping pod as bad with its restarts', () => {
    const state = podState({
      metadata: { name: 'alloy-1' },
      spec: { containers: [{ name: 'alloy' }] },
      status: {
        phase: 'Running',
        containerStatuses: [
          { ready: false, restartCount: 7, state: { waiting: { reason: 'CrashLoopBackOff' } } },
        ],
      },
    });
    expect(state).toEqual({ status: 'CrashLoopBackOff', tone: 'bad', ready: '0/1', restarts: 7 });
  });

  it('summarises a deployment by its ready replicas', () => {
    const row = toRow(kindById('deployments'), {
      metadata: { name: 'caddy', namespace: 'homelab' },
      spec: { replicas: 2, template: { spec: { containers: [{ image: 'caddy:2' }] } } },
      status: { readyReplicas: 1 },
    });
    expect([row.status, row.tone, row.details]).toEqual(['1/2 ready', 'warn', 'caddy:2']);
  });

  it('builds a manual job from a cron job template', () => {
    const job = cronJobRun(
      {
        metadata: { name: 'backups-postgres', namespace: 'homelab', uid: 'u1' },
        spec: { jobTemplate: { spec: { template: { spec: { containers: [] } } } } },
      },
      1_000_000,
    );
    expect(job.metadata.name).toBe('backups-postgres-manual-1000');
    expect(job.spec).toEqual({ template: { spec: { containers: [] } } });
  });
});
