import { Provider } from '@angular/core';
import { provideHomelabFeature } from '@shell/application/homelab-features';

export function provideKitchenFeature(): Provider[] {
  return [
    provideHomelabFeature(() => ({
      id: 'kitchen',
      hue: 'amber',
      access: 'app:kitchen',
      label: 'Kitchen',
      description: 'Formulate recipes, scale portions, track macros.',
      category: 'Life',
      color: '#d97706',
      icon: [
        'M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2',
        'M7 2v20',
        'M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7',
      ],
      entry: { kind: 'page', path: '/kitchen' },
    })),
  ];
}
