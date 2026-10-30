import { Provider } from '@angular/core';
import { provideHomelabFeature } from '@shell/application/homelab-features';

export function provideStatusFeature(): Provider {
  return provideHomelabFeature(() => ({
    id: 'status',
    label: 'Status',
    description: 'Is every container ready? Links and addresses for each one.',
    category: 'Platform',
    color: '#10b981',
    icon: ['M3 12h4l3-8 4 16 3-8h4'],
    entry: { kind: 'page', path: '/status' },
  }));
}
