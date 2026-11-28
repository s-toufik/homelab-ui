import { Provider, inject } from '@angular/core';
import { CAST_ACCOUNT } from '@shell/application/cast-account';
import { CENTER_ACCOUNT } from '@shell/application/center-account';
import { THEME_ACCOUNT } from '@shell/application/theme-account';
import { provideHomelabFeature } from '@shell/application/homelab-features';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import { AccountCastAdapter } from './infrastructure/api/account-cast.adapter';
import { AccountCenterAdapter } from './infrastructure/api/account-center.adapter';
import { AccountThemeAdapter } from './infrastructure/api/account-theme.adapter';
import ACCOUNT from './infrastructure/account-api.json';

export function provideAccountFeature(): Provider[] {
  return [
    { provide: THEME_ACCOUNT, useExisting: AccountThemeAdapter },
    { provide: CAST_ACCOUNT, useExisting: AccountCastAdapter },
    { provide: CENTER_ACCOUNT, useExisting: AccountCenterAdapter },
    provideHomelabFeature(() => {
      const server = inject(HomelabServer);
      return {
        id: 'account',
        hue: 'slate',
        label: 'Account',
        description: 'Your profile, password and sessions.',
        category: 'Platform',
        color: '#64748b',
        icon: ['M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z', 'M4 20a8 8 0 0 1 16 0'],
        entry: { kind: 'page', path: '/account' },
        checkHealth: () => server.isReachable(ACCOUNT),
      };
    }),
  ];
}
