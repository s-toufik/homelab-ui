import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AppsStore } from '@shell/application/apps.store';
import type { HomelabApp } from '@shell/domain/homelab-app';
import { PreviewPeople } from '../infrastructure/api/preview-people';
import { PEOPLE_DIRECTORY, type PeopleDirectory } from './people-directory';
import { PeopleStore } from './people.store';

const app = (access: string, extra: Partial<HomelabApp> = {}): HomelabApp => ({
  id: access,
  label: access,
  tagline: '',
  hue: 'orange',
  icon: [],
  path: '/',
  kind: 'page',
  category: null,
  access,
  ...extra,
});

function setup(directory: PeopleDirectory = new PreviewPeople()) {
  TestBed.configureTestingModule({
    providers: [
      { provide: PEOPLE_DIRECTORY, useValue: directory },
      {
        provide: AppsStore,
        useValue: {
          all: signal([
            app('agent:kitchen'),
            app('page:metrics'),
            app('kube', { access: undefined }),
            app('x', { adminOnly: true }),
          ]),
          load: async () => undefined,
        },
      },
    ],
  });
  return TestBed.inject(PeopleStore);
}

describe('PeopleStore', () => {
  it('offers every page that has a role and is not admin only', () => {
    expect(
      setup()
        .options()
        .map((option) => [option.role, option.group]),
    ).toEqual([
      ['agent:kitchen', 'Assistants'],
      ['page:metrics', 'Tools'],
    ]);
  });

  it('gives and takes a page at once, and puts it back when Keycloak refuses', async () => {
    const preview = new PreviewPeople();
    const store = setup(preview);
    await store.load();
    const dora = store.people().find((p) => p.username === 'dora')!;

    await store.toggle(dora, 'page:metrics');
    expect(store.people().find((p) => p.id === dora.id)!.roles).toContain('page:metrics');

    preview.revoke = () => Promise.reject(new Error('403'));
    await store.toggle(
      store.people().find((p) => p.id === dora.id)!,
      'page:metrics',
    );
    expect(store.people().find((p) => p.id === dora.id)!.roles).toContain('page:metrics');
    expect(store.error()).toContain('403');
  });

  it('creates a person with a temporary password and the chosen pages', async () => {
    const store = setup();
    const { password, pagesError } = await store.create(
      { username: 'mia', firstName: 'Mia', lastName: '', email: '' },
      ['agent:kitchen'],
    );
    const mia = store.people().find((p) => p.username === 'mia')!;
    expect(password).toMatch(/^[A-Za-z2-9-]{23}$/);
    expect(pagesError).toBeNull();
    expect(mia.roles).toEqual(['agent:kitchen']);
    expect(mia.mustSetPassword).toBe(true);
  });
});
