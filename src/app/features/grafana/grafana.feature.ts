import { Provider, inject } from '@angular/core';
import { provideHomelabFeature } from '@shell/application/homelab-features';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import GRAFANA from './infrastructure/grafana.json';

export function provideGrafanaFeature(): Provider {
  return provideHomelabFeature(() => {
    const server = inject(HomelabServer);
    return {
      id: 'grafana',
      label: 'Grafana',
      description: 'Dashboards for metrics, logs and traces.',
      category: 'Observability',
      color: '#f97316',
      icon: [
        'M5 4h14a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z',
        'm7 15 3-3 3 2 4-5',
      ],
      entry: { kind: 'link', url: server.url(GRAFANA) },
      checkHealth: () => server.isReachable(GRAFANA),
    };
  });
}
