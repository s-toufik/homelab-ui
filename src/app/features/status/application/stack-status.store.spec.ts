import { TestBed } from '@angular/core/testing';
import { API_ROUTING, HOMELAB_SERVER_URL } from '@shared/infrastructure/homelab-server';
import { STACK_SERVICES } from '../domain/stack-services';
import { StackStatusStore } from './stack-status.store';

function prometheusAnswer(value: string | null) {
  const result = value === null ? [] : [{ value: [0, value] }];
  return new Response(JSON.stringify({ status: 'success', data: { result } }));
}

function store(): StackStatusStore {
  TestBed.configureTestingModule({
    providers: [
      { provide: API_ROUTING, useValue: 'gateway' },
      { provide: HOMELAB_SERVER_URL, useValue: 'https://sirius.example.ts.net' },
    ],
  });
  return TestBed.inject(StackStatusStore);
}

describe('StackStatusStore', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('lists every container once, grouped like homelab-infra', () => {
    const ids = STACK_SERVICES.map((service) => service.id);

    expect(new Set(ids).size).toBe(ids.length);
    expect(store().groups.map((section) => section.group)).toEqual([
      'Gateway',
      'Repository',
      'Message broker',
      'Observability',
      'AI',
      'Apps',
    ]);
  });

  it('reads health routes through the gateway and metrics through Prometheus', async () => {
    const fetch = vi.fn((url: string) => {
      if (url.startsWith('/api/prometheus/')) {
        return Promise.resolve(prometheusAnswer(url.includes('kafka_brokers') ? '0' : '1'));
      }
      if (url === '/api/health/loki') return Promise.resolve(new Response('', { status: 503 }));
      return Promise.resolve(new Response('OK'));
    });
    vi.stubGlobal('fetch', fetch);
    const current = store();

    await current.refresh();

    expect(current.states()['grafana']).toBe('ready');
    expect(current.states()['loki']).toBe('not-ready');
    expect(current.states()['postgres']).toBe('ready');
    expect(current.states()['kafka']).toBe('not-ready');
    expect(current.summary()).toMatchObject({ notReady: 2, total: STACK_SERVICES.length });
    expect(current.checkedAt()).not.toBeNull();
    expect(fetch).toHaveBeenCalledWith('/api/health/agent-toolbox', expect.anything());
  });

  it('marks a metric with no data as unknown and a network failure as not ready', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) =>
        url.startsWith('/api/prometheus/')
          ? Promise.resolve(prometheusAnswer(null))
          : Promise.reject(new TypeError('Failed to fetch')),
      ),
    );
    const current = store();

    await current.refresh();

    expect(current.states()['mongodb']).toBe('unknown');
    expect(current.states()['caddy']).toBe('not-ready');
  });
});
