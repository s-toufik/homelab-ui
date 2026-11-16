import { TestBed } from '@angular/core/testing';
import { GatewayApi } from '@shared/infrastructure/gateway-api';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import { KeycloakPeople, idFromLocation, toPerson } from './keycloak-people';

describe('Keycloak people mapping', () => {
  it('reads an account, its realm roles and whether it must set a password', () => {
    expect(
      toPerson(
        {
          id: 'u1',
          username: 'dora',
          firstName: 'Dora',
          enabled: true,
          createdTimestamp: 5,
          requiredActions: ['UPDATE_PASSWORD'],
        },
        [{ name: 'agent:travel' }, { name: 'agent:kitchen' }],
      ),
    ).toEqual({
      id: 'u1',
      username: 'dora',
      firstName: 'Dora',
      lastName: '',
      email: '',
      enabled: true,
      createdAt: 5,
      mustSetPassword: true,
      roles: ['agent:kitchen', 'agent:travel'],
    });
  });

  it("takes the new account's id from the Location header", () => {
    expect(idFromLocation('https://h/admin/realms/homelab/users/3f2a-11b9')).toBe('3f2a-11b9');
    expect(() => idFromLocation(null)).toThrow();
  });
});

describe('Keycloak people roles', () => {
  it('sends the role id with its name, as Keycloak requires, and reuses it', async () => {
    const calls: { url: string; body?: unknown }[] = [];
    TestBed.configureTestingModule({
      providers: [
        {
          provide: HomelabServer,
          useValue: { api: (_: unknown, path: string) => `/api/people${path}` },
        },
        {
          provide: GatewayApi,
          useValue: {
            json: async (url: string) => {
              calls.push({ url });
              return [{ id: 'r-kitchen', name: 'agent:kitchen' }];
            },
            send: async (url: string, request: { body?: unknown }) => {
              calls.push({ url, body: request.body });
              return new Response(null, { status: 204 });
            },
          },
        },
      ],
    });
    const people = TestBed.inject(KeycloakPeople);
    await people.grant('u1', 'agent:kitchen');
    await people.revoke('u1', 'agent:kitchen');
    expect(calls).toEqual([
      { url: '/api/people/users/u1/role-mappings/realm/available' },
      {
        url: '/api/people/users/u1/role-mappings/realm',
        body: [{ id: 'r-kitchen', name: 'agent:kitchen' }],
      },
      {
        url: '/api/people/users/u1/role-mappings/realm',
        body: [{ id: 'r-kitchen', name: 'agent:kitchen' }],
      },
    ]);
    await expect(people.grant('u1', 'page:missing')).rejects.toThrow('no role page:missing');
  });
});
