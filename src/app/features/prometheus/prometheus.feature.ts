import { Provider, inject } from '@angular/core';
import { provideHomelabFeature } from '@shell/application/homelab-features';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import PROMETHEUS from './infrastructure/prometheus.json';

export function providePrometheusFeature(): Provider {
  return provideHomelabFeature(() => {
    const server = inject(HomelabServer);
    return {
      id: 'prometheus',
      label: 'Prometheus',
      description: 'Query metrics and check scrape targets.',
      category: 'Observability',
      color: '#f43f5e',
      icon: ['M4 20V10M10 20V4M16 20v-7M22 20H2'],
      entry: { kind: 'link', url: server.url(PROMETHEUS) },
      checkHealth: () => server.isReachable(PROMETHEUS),
    };
  });
}
