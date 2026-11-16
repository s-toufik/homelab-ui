import type { Hue } from '@shell/domain/homelab-feature';

export const ADMIN_ROLE = 'admin';
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{1,62}$/;
export const EMAIL_PATTERN = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

export function isEmail(value: string): boolean {
  return EMAIL_PATTERN.test(value.trim());
}

export function peopleError(error: unknown, action: string): string {
  const status = (error as { status?: number }).status;
  if (status === 404) {
    return `Couldn't ${action}: the gateway has no People API yet. On the server, apply homelab-infra's changes: make apply R=keycloak, then make apply R=caddy.`;
  }
  if (status === 401)
    return `Couldn't ${action}: your session ended. Reload the page to sign in again.`;
  if (status === 403) {
    return `Couldn't ${action}: Keycloak refused. The admin role needs its account-management rights, which make apply R=keycloak adds.`;
  }
  if (status === 409) return `Couldn't ${action}: that username or email is already taken.`;
  return `Couldn't ${action}: ${(error as Error).message}`;
}

export interface Person {
  readonly id: string;
  readonly username: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
  readonly enabled: boolean;
  readonly createdAt: number | null;
  readonly mustSetPassword: boolean;
  readonly roles: readonly string[];
}

export interface NewPerson {
  readonly username: string;
  readonly firstName: string;
  readonly lastName: string;
  readonly email: string;
}

export type PageGroup = 'Assistants' | 'Apps' | 'Tools';
export const PAGE_GROUPS: readonly PageGroup[] = ['Assistants', 'Apps', 'Tools'];

export interface PageOption {
  readonly role: string;
  readonly label: string;
  readonly hue: Hue;
  readonly group: PageGroup;
}

export function isAdmin(person: Person): boolean {
  return person.roles.includes(ADMIN_ROLE);
}

export function displayName(person: Pick<Person, 'firstName' | 'lastName' | 'username'>): string {
  return [person.firstName, person.lastName].filter(Boolean).join(' ') || person.username;
}

export function pagesOf(person: Person, options: readonly PageOption[]): PageOption[] {
  return options.filter((option) => person.roles.includes(option.role));
}

export function groupOf(role: string): PageGroup {
  if (role.startsWith('agent:')) return 'Assistants';
  if (role.startsWith('app:')) return 'Apps';
  return 'Tools';
}

export function sortPeople(people: readonly Person[]): Person[] {
  return [...people].sort(
    (a, b) =>
      Number(isAdmin(b)) - Number(isAdmin(a)) ||
      Number(b.enabled) - Number(a.enabled) ||
      displayName(a).localeCompare(displayName(b)),
  );
}
