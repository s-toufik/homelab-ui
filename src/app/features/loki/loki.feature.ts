import { Provider, inject } from '@angular/core';
import { provideHomelabFeature } from '@shell/application/homelab-features';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import LOKI from '@shared/infrastructure/loki.json';

export function provideLokiFeature(): Provider {
  return provideHomelabFeature(() => {
    const server = inject(HomelabServer);
    return {
      id: 'loki',
      label: 'Logs',
      description: "Search every container's logs (Loki).",
      category: 'Observability',
      color: '#eab308',
      icon: ['M4 6h16M4 10h16M4 14h10M4 18h7', 'm17 15 2 2 3-4'],
      entry: { kind: 'page', path: '/logs' },
      checkHealth: () => server.isReachable(LOKI),
    };
  });
}
