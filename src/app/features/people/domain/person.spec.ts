import { displayName, groupOf, sortPeople, type Person } from './person';
import { TEMPORARY_PASSWORD_LENGTH, temporaryPassword } from './temporary-password';

function person(username: string, extra: Partial<Person> = {}): Person {
  return {
    id: username,
    username,
    firstName: '',
    lastName: '',
    email: '',
    enabled: true,
    createdAt: null,
    mustSetPassword: false,
    roles: [],
    ...extra,
  };
}

describe('people', () => {
  it('puts admins first, then enabled people, then by name', () => {
    const sorted = sortPeople([
      person('zoe', { enabled: false }),
      person('dora', { firstName: 'Dora' }),
      person('toufik', { roles: ['admin'] }),
      person('ben'),
    ]);
    expect(sorted.map((p) => p.username)).toEqual(['toufik', 'ben', 'dora', 'zoe']);
  });

  it('shows a name, or the username when there is none', () => {
    expect(displayName(person('dora', { firstName: 'Dora', lastName: 'S' }))).toBe('Dora S');
    expect(displayName(person('guest'))).toBe('guest');
  });

  it('groups pages into assistants, apps and tools', () => {
    expect([groupOf('agent:kitchen'), groupOf('app:tasker'), groupOf('page:metrics')]).toEqual([
      'Assistants',
      'Apps',
      'Tools',
    ]);
  });
});

describe('temporary password', () => {
  it('has 20 easy-to-read characters in groups of five, above the 12-character policy', () => {
    const password = temporaryPassword();
    expect(password).toMatch(/^[A-Za-z2-9]{5}(-[A-Za-z2-9]{5}){3}$/);
    expect(password.replace(/-/g, '')).toHaveLength(TEMPORARY_PASSWORD_LENGTH);
    expect(password).not.toMatch(/[0O1lI]/);
  });

  it('skips bytes that would make some characters more likely', () => {
    let call = 0;
    const random = (bytes: Uint8Array) => bytes.fill(call++ === 0 ? 255 : 0);
    expect(temporaryPassword(random).replace(/-/g, '')).toBe('A'.repeat(20));
  });
});
