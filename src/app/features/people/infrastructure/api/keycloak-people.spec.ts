import { idFromLocation, toPerson } from './keycloak-people';

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
