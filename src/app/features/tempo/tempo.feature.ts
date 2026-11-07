import { Provider, inject } from '@angular/core';
import { provideHomelabFeature } from '@shell/application/homelab-features';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import TEMPO from './infrastructure/tempo.json';

export function provideTempoFeature(): Provider {
  return provideHomelabFeature(() => {
    const server = inject(HomelabServer);
    return {
      id: 'tempo',
      label: 'Traces',
      description: 'Find a request and follow it span by span (Tempo).',
      category: 'Observability',
      color: '#0ea5e9',
      icon: ['M4 6h10M8 12h10M6 18h8', 'M4 4v4M8 10v4M6 16v4'],
      entry: { kind: 'page', path: '/traces' },
      checkHealth: () => server.isReachable(TEMPO),
    };
  });
}
