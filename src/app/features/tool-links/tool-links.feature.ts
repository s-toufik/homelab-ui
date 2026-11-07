import { Provider } from '@angular/core';
import { provideHomelabFeature } from '@shell/application/homelab-features';

export function provideToolLinksFeature(): Provider {
  return provideHomelabFeature(() => ({
    id: 'tool-links',
    label: 'Tool UIs',
    description: "Open each tool's own web interface: Grafana, Prometheus, Kafka UI, Alloy…",
    category: 'Platform',
    color: '#94a3b8',
    icon: [
      'M10 14a4 4 0 0 0 5.66 0l3-3a4 4 0 0 0-5.66-5.66l-1 1',
      'M14 10a4 4 0 0 0-5.66 0l-3 3a4 4 0 0 0 5.66 5.66l1-1',
    ],
    entry: { kind: 'page', path: '/tool-uis' },
  }));
}
