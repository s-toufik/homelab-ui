import { Provider, inject } from '@angular/core';
import { provideHomelabFeature } from '@shell/application/homelab-features';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import ALLOY from './infrastructure/alloy.json';

export function provideAlloyFeature(): Provider {
  return provideHomelabFeature(() => {
    const server = inject(HomelabServer);
    return {
      id: 'alloy',
      label: 'Alloy',
      description: 'Collection pipelines for host metrics and container logs.',
      category: 'Observability',
      color: '#14b8a6',
      icon: [
        'M3 6a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
        'M3 18a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
        'M17 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0',
        'M7 6h3a3 3 0 0 1 3 3a3 3 0 0 0 3 3h1M7 18h3a3 3 0 0 0 3-3a3 3 0 0 1 3-3',
      ],
      entry: { kind: 'link', url: server.url(ALLOY) },
      checkHealth: () => server.isReachable(ALLOY),
    };
  });
}
