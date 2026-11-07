import { toRules, toTargets } from './prometheus-api.service';

describe('Prometheus API mapping', () => {
  it('reads targets with their job, instance and health, sorted', () => {
    const targets = toTargets({
      data: {
        activeTargets: [
          {
            labels: { job: 'node', instance: 'b:9100' },
            scrapePool: 'node',
            scrapeUrl: 'http://b:9100/metrics',
            health: 'down',
            lastError: 'refused',
            lastScrape: '2026-11-07T10:00:00Z',
            lastScrapeDuration: 0.01,
          },
          {
            labels: { job: 'caddy' },
            scrapePool: 'caddy',
            scrapeUrl: 'http://caddy:2019/metrics',
            health: 'up',
            lastError: '',
            lastScrape: '2026-11-07T10:00:00Z',
            lastScrapeDuration: 0.002,
          },
        ],
      },
    });

    expect(targets.map((t) => [t.job, t.instance, t.health])).toEqual([
      ['caddy', 'http://caddy:2019/metrics', 'up'],
      ['node', 'b:9100', 'down'],
    ]);
  });

  it('splits alerting from recording rules and puts firing alerts first', () => {
    const rules = toRules({
      data: {
        groups: [
          {
            name: 'homelab',
            rules: [
              { type: 'alerting', name: 'DiskFull', query: 'x', health: 'ok', state: 'inactive' },
              {
                type: 'alerting',
                name: 'PodDown',
                query: 'y',
                health: 'ok',
                state: 'firing',
                annotations: { summary: 'a pod is down' },
                alerts: [{ state: 'firing', activeAt: '2026-11-07T09:00:00Z' }],
              },
              { type: 'recording', name: 'job:up:sum', query: 'sum(up)', health: 'ok' },
            ],
          },
        ],
      },
    });

    expect(rules.alerts.map((a) => [a.name, a.state, a.firing])).toEqual([
      ['PodDown', 'firing', 1],
      ['DiskFull', 'inactive', 0],
    ]);
    expect(rules.alerts[0].summary).toBe('a pod is down');
    expect(rules.recordings).toHaveLength(1);
  });
});
