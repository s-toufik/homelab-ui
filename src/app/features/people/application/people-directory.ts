import { InjectionToken } from '@angular/core';
import type { NewPerson, Person } from '../domain/person';

export interface PeopleDirectory {
  readonly preview: boolean;
  list(): Promise<Person[]>;
  create(person: NewPerson, temporaryPassword: string): Promise<string>;
  grant(id: string, role: string): Promise<void>;
  revoke(id: string, role: string): Promise<void>;
  setEnabled(id: string, enabled: boolean): Promise<void>;
  signOut(id: string): Promise<void>;
  resetPassword(id: string, temporaryPassword: string): Promise<void>;
}

export const PEOPLE_DIRECTORY = new InjectionToken<PeopleDirectory>('PEOPLE_DIRECTORY');
