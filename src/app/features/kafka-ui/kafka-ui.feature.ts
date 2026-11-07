import { Provider, inject } from '@angular/core';
import { provideHomelabFeature } from '@shell/application/homelab-features';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import KAFKA_UI from './infrastructure/kafka-ui.json';

export function provideKafkaUiFeature(): Provider {
  return provideHomelabFeature(() => {
    const server = inject(HomelabServer);
    return {
      id: 'kafka-ui',
      label: 'Kafka',
      description: 'Topics, messages and consumer groups.',
      category: 'Streaming',
      color: '#f59e0b',
      icon: ['M3 7h13M3 12h18M3 17h10', 'm14 4 3 3-3 3'],
      entry: { kind: 'page', path: '/kafka' },
      checkHealth: () => server.isReachable(KAFKA_UI),
    };
  });
}
