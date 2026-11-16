import { Provider } from '@angular/core';
import { provideHomelabFeature } from '@shell/application/homelab-features';

export function provideMapFeature(): Provider {
  return provideHomelabFeature(() => ({
    id: 'map',
    label: 'Map',
    description: 'The cluster, live: every service, what it talks to, and its state.',
    category: 'Platform',
    color: '#58a6ff',
    hue: 'blue',
    adminOnly: true,
    listed: false,
    icon: ['M9 4L3 6.5v13.5l6-2.5 6 2.5 6-2.5V4l-6 2.5z', 'M9 4v13.5M15 6.5V20'],
    entry: { kind: 'page', path: '/map' },
  }));
}
