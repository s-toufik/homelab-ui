import { Injectable, computed, inject, signal } from '@angular/core';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { AppsStore } from '@shell/application/apps.store';
import {
  groupOf,
  peopleError,
  sortPeople,
  type NewPerson,
  type PageOption,
  type Person,
} from '../domain/person';
import { temporaryPassword } from '../domain/temporary-password';
import { PEOPLE_DIRECTORY } from './people-directory';

@Injectable({ providedIn: 'root' })
export class PeopleStore {
  private readonly directory = inject(PEOPLE_DIRECTORY);
  private readonly apps = inject(AppsStore);
  private readonly session = inject(GatewaySession);

  readonly preview = this.directory.preview;
  readonly people = signal<Person[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly busy = signal<ReadonlySet<string>>(new Set());
  readonly me = computed(() => this.session.user()?.username ?? null);

  readonly options = computed<PageOption[]>(() =>
    this.apps
      .all()
      .filter((app) => app.access && !app.adminOnly)
      .map((app) => ({
        role: app.access!,
        label: app.label,
        hue: app.hue,
        group: groupOf(app.access!),
      })),
  );

  async load(): Promise<void> {
    this.loading.set(true);
    void this.apps.load();
    try {
      this.people.set(sortPeople(await this.directory.list()));
      this.error.set(null);
    } catch (error) {
      this.error.set(peopleError(error, 'load the people'));
    } finally {
      this.loading.set(false);
    }
  }

  async toggle(person: Person, role: string): Promise<void> {
    const had = person.roles.includes(role);
    this.replace(person.id, (current) => ({
      ...current,
      roles: had ? current.roles.filter((r) => r !== role) : [...current.roles, role].sort(),
    }));
    await this.run(
      `${person.id}:${role}`,
      async () => {
        if (had) await this.directory.revoke(person.id, role);
        else await this.directory.grant(person.id, role);
      },
      () => this.replace(person.id, () => person),
    );
  }

  async setEnabled(person: Person, enabled: boolean): Promise<void> {
    this.replace(person.id, (current) => ({ ...current, enabled }));
    await this.run(
      person.id,
      () => this.directory.setEnabled(person.id, enabled),
      () => this.replace(person.id, () => person),
    );
  }

  async signOut(person: Person): Promise<void> {
    await this.run(person.id, () => this.directory.signOut(person.id));
  }

  async resetPassword(person: Person): Promise<string | null> {
    const password = temporaryPassword();
    const done = await this.run(person.id, () => this.directory.resetPassword(person.id, password));
    if (done) this.replace(person.id, (current) => ({ ...current, mustSetPassword: true }));
    return done ? password : null;
  }

  async create(person: NewPerson, roles: readonly string[]): Promise<string> {
    const password = temporaryPassword();
    const id = await this.directory.create(person, password);
    for (const role of roles) await this.directory.grant(id, role);
    await this.load();
    return password;
  }

  isBusy(key: string): boolean {
    return this.busy().has(key);
  }

  private replace(id: string, change: (person: Person) => Person): void {
    this.people.update((people) =>
      people.map((person) => (person.id === id ? change(person) : person)),
    );
  }

  private async run(key: string, action: () => Promise<void>, undo?: () => void): Promise<boolean> {
    this.busy.update((keys) => new Set([...keys, key]));
    try {
      await action();
      this.error.set(null);
      return true;
    } catch (error) {
      undo?.();
      this.error.set(peopleError(error, 'save the change'));
      return false;
    } finally {
      this.busy.update((keys) => new Set([...keys].filter((k) => k !== key)));
    }
  }
}
