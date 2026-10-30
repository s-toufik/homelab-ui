import { Provider, inject } from '@angular/core';
import { provideHomelabFeature } from '@shell/application/homelab-features';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import KEYCLOAK_ACCOUNT from './infrastructure/keycloak-account.json';

export function provideAccountFeature(): Provider {
  return provideHomelabFeature(() => {
    const server = inject(HomelabServer);
    return {
      id: 'account',
      label: 'Account',
      description: 'Change your password, see and end your sessions.',
      category: 'Platform',
      color: '#64748b',
      icon: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 20a8 8 0 0 1 16 0'],
      entry: { kind: 'link', url: server.url(KEYCLOAK_ACCOUNT) },
      checkHealth: () => server.isReachable(KEYCLOAK_ACCOUNT),
    };
  });
}
