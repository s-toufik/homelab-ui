import { Provider } from '@angular/core';
import { provideHomelabFeature } from '@shell/application/homelab-features';

export function provideIssuesFeature(): Provider[] {
  return [
    provideHomelabFeature(() => ({
      id: 'issues',
      hue: 'rose',
      access: 'app:issues',
      label: 'Issues',
      description: 'Report something that looks or behaves wrong.',
      category: 'Platform',
      color: '#e11d48',
      icon: ['M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z', 'M4 22v-7'],
      entry: { kind: 'page', path: '/issues' },
    })),
  ];
}
