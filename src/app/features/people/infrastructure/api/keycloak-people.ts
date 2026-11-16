import { Injectable, inject } from '@angular/core';
import { GatewayApi } from '@shared/infrastructure/gateway-api';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import type { PeopleDirectory } from '../../application/people-directory';
import type { NewPerson, Person } from '../../domain/person';
import PEOPLE from '../people-api.json';

export interface KeycloakUser {
  id: string;
  username: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  enabled?: boolean;
  createdTimestamp?: number;
  requiredActions?: string[];
}

interface KeycloakRole {
  name: string;
}

const MAX_PEOPLE = 500;

export function toPerson(user: KeycloakUser, roles: readonly KeycloakRole[]): Person {
  return {
    id: user.id,
    username: user.username,
    firstName: user.firstName ?? '',
    lastName: user.lastName ?? '',
    email: user.email ?? '',
    enabled: user.enabled !== false,
    createdAt: user.createdTimestamp ?? null,
    mustSetPassword: (user.requiredActions ?? []).includes('UPDATE_PASSWORD'),
    roles: roles.map((role) => role.name).sort(),
  };
}

export function idFromLocation(location: string | null): string {
  const id = location?.split('/').pop() ?? '';
  if (!/^[0-9a-f-]+$/.test(id)) throw new Error('Keycloak did not say which account it created.');
  return id;
}

@Injectable({ providedIn: 'root' })
export class KeycloakPeople implements PeopleDirectory {
  private readonly api = inject(GatewayApi);
  private readonly server = inject(HomelabServer);
  readonly preview = false;

  private url(path: string): string {
    return this.server.api(PEOPLE, path);
  }

  private user(id: string, path = ''): string {
    return this.url(`/users/${encodeURIComponent(id)}${path}`);
  }

  async list(): Promise<Person[]> {
    const users = await this.api.json<KeycloakUser[]>(
      this.url(`/users?briefRepresentation=false&max=${MAX_PEOPLE}`),
    );
    return Promise.all(
      users.map(async (user) =>
        toPerson(
          user,
          await this.api.json<KeycloakRole[]>(this.user(user.id, '/role-mappings/realm')),
        ),
      ),
    );
  }

  async create(person: NewPerson, temporaryPassword: string): Promise<string> {
    const response = await this.api.send(this.url('/users'), {
      method: 'POST',
      body: {
        username: person.username,
        firstName: person.firstName,
        lastName: person.lastName,
        ...(person.email ? { email: person.email, emailVerified: true } : {}),
        enabled: true,
        requiredActions: ['UPDATE_PASSWORD'],
      },
    });
    const id = idFromLocation(response.headers.get('Location'));
    await this.resetPassword(id, temporaryPassword);
    return id;
  }

  async grant(id: string, role: string): Promise<void> {
    await this.api.send(this.user(id, '/role-mappings/realm'), {
      method: 'POST',
      body: [{ name: role }],
    });
  }

  async revoke(id: string, role: string): Promise<void> {
    await this.api.send(this.user(id, '/role-mappings/realm'), {
      method: 'DELETE',
      body: [{ name: role }],
    });
  }

  async setEnabled(id: string, enabled: boolean): Promise<void> {
    await this.api.send(this.user(id), { method: 'PUT', body: { enabled } });
    if (!enabled) await this.signOut(id);
  }

  async signOut(id: string): Promise<void> {
    await this.api.send(this.user(id, '/logout'), { method: 'POST' });
  }

  async remove(id: string): Promise<void> {
    await this.api.send(this.user(id), { method: 'DELETE' });
  }

  async resetPassword(id: string, temporaryPassword: string): Promise<void> {
    await this.api.send(this.user(id, '/reset-password'), {
      method: 'PUT',
      body: { type: 'password', value: temporaryPassword, temporary: true },
    });
  }
}
