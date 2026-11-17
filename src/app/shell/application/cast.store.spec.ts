import { TestBed } from '@angular/core/testing';
import { memoryStorage } from '@features/agent/infrastructure/storage/memory-storage';
import { CAST_STORAGE_KEY } from '../infrastructure/cast-preferences.storage';
import { THEME_PREFERENCES_STORAGE } from '../infrastructure/theme-preferences.storage';
import { CAST_ACCOUNT, type CastAccount } from './cast-account';
import { CastStore } from './cast.store';
import { COLOR_SCHEME_QUERY, ThemeStore } from './theme.store';
import type { CastChoice } from '../domain/agent-cast';

function setup(saved: CastChoice | null = null) {
  const storage = memoryStorage();
  const written: CastChoice[] = [];
  const account: CastAccount = {
    read: async () => saved,
    write: async (choice) => void written.push(choice),
  };
  TestBed.configureTestingModule({
    providers: [
      { provide: THEME_PREFERENCES_STORAGE, useValue: storage },
      { provide: CAST_ACCOUNT, useValue: account },
      { provide: COLOR_SCHEME_QUERY, useValue: null },
    ],
  });
  return { store: TestBed.inject(CastStore), theme: TestBed.inject(ThemeStore), storage, written };
}

describe('CastStore', () => {
  it('matches the theme by default and keeps a chosen cast when the theme changes', () => {
    const { store, theme, storage, written } = setup();
    theme.choose('wizarding');
    expect(store.active()).toBe('wizarding');

    store.choose('pocket');
    theme.choose('regency');

    expect(store.active()).toBe('pocket');
    expect(storage.getItem(CAST_STORAGE_KEY)).toBe('pocket');
    expect(written).toEqual(['pocket']);
  });

  it('takes the cast saved on the account', async () => {
    const { store } = setup('digital');

    await store.loadFromAccount();

    expect(store.choice()).toBe('digital');
  });
});
