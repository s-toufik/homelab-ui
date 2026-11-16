import { Provider, inject } from '@angular/core';
import { API_ROUTING } from '@shared/infrastructure/homelab-server';
import { PEOPLE_DIRECTORY } from './application/people-directory';
import { KeycloakPeople } from './infrastructure/api/keycloak-people';
import { PreviewPeople } from './infrastructure/api/preview-people';

export function providePeopleFeature(): Provider[] {
  return [
    {
      provide: PEOPLE_DIRECTORY,
      useFactory: () =>
        inject(API_ROUTING) === 'gateway' ? inject(KeycloakPeople) : inject(PreviewPeople),
    },
  ];
}
