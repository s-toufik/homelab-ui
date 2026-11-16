import { Injectable } from '@angular/core';
import type { PeopleDirectory } from '../../application/people-directory';
import type { NewPerson, Person } from '../../domain/person';

const DAY = 86_400_000;

@Injectable({ providedIn: 'root' })
export class PreviewPeople implements PeopleDirectory {
  readonly preview = true;
  private people: Person[] = [
    this.make('toufik', 'Toufik', ['admin'], 120),
    this.make('dora', 'Dora', ['agent:kitchen', 'agent:travel'], 30),
    this.make('sami', 'Sami', ['agent:kitchen', 'app:tasker'], 12),
    { ...this.make('guest', 'Guest', [], 90), enabled: false },
  ];

  private make(username: string, firstName: string, roles: string[], daysAgo: number): Person {
    return {
      id: `preview-${username}`,
      username,
      firstName,
      lastName: '',
      email: '',
      enabled: true,
      createdAt: Date.now() - daysAgo * DAY,
      mustSetPassword: false,
      roles,
    };
  }

  private update(id: string, change: (person: Person) => Person): void {
    this.people = this.people.map((person) => (person.id === id ? change(person) : person));
  }

  async list(): Promise<Person[]> {
    return this.people;
  }

  async create(person: NewPerson): Promise<string> {
    const created = {
      ...this.make(person.username, person.firstName, [], 0),
      ...person,
      mustSetPassword: true,
    };
    this.people = [...this.people, created];
    return created.id;
  }

  async grant(id: string, role: string): Promise<void> {
    this.update(id, (person) => ({
      ...person,
      roles: [...new Set([...person.roles, role])].sort(),
    }));
  }

  async revoke(id: string, role: string): Promise<void> {
    this.update(id, (person) => ({ ...person, roles: person.roles.filter((r) => r !== role) }));
  }

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    this.update(id, (person) => ({ ...person, enabled }));
  }

  async signOut(): Promise<void> {
    return;
  }

  async resetPassword(id: string): Promise<void> {
    this.update(id, (person) => ({ ...person, mustSetPassword: true }));
  }
}
