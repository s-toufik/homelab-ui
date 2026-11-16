import type { Hue } from '@shell/domain/homelab-feature';

export const ADMIN_ROLE = 'admin';
export const USERNAME_PATTERN = /^[a-z0-9][a-z0-9._-]{1,62}$/;

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
