import { Provider, inject } from '@angular/core';
import { provideHomelabFeature } from '@shell/application/homelab-features';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import ACCOUNT from './infrastructure/account-api.json';

export function provideAccountFeature(): Provider {
  return provideHomelabFeature(() => {
    const server = inject(HomelabServer);
    return {
      id: 'account',
      label: 'Account',
      description: 'Your profile, password and sessions.',
      category: 'Platform',
      color: '#64748b',
      icon: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 20a8 8 0 0 1 16 0'],
      entry: { kind: 'page', path: '/account' },
      checkHealth: () => server.isReachable(ACCOUNT),
    };
  });
}
