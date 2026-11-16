import { TestBed } from '@angular/core/testing';
import { resolveTheme, type ThemeChoice } from '../domain/theme-preferences';
import {
  THEME_PREFERENCES_STORAGE,
  THEME_STORAGE_KEY,
} from '../infrastructure/theme-preferences.storage';
import { THEME_ACCOUNT, type ThemeAccount } from './theme-account';
import { COLOR_SCHEME_QUERY, ThemeStore } from './theme.store';

function memoryStorage(initial: Record<string, string> = {}): Storage {
  const items = new Map(Object.entries(initial));
  return {
    get length() {
      return items.size;
    },
    clear: () => items.clear(),
    getItem: (key) => items.get(key) ?? null,
    key: (index) => [...items.keys()][index] ?? null,
    removeItem: (key) => void items.delete(key),
    setItem: (key, value) => void items.set(key, value),
  };
}

function fakeQuery(matches: boolean): MediaQueryList {
  return {
    matches,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
  } as unknown as MediaQueryList;
}

function setup(options: { saved?: ThemeChoice; dark?: boolean; account?: ThemeAccount } = {}) {
  const storage = memoryStorage(
    options.saved ? { [THEME_STORAGE_KEY]: JSON.stringify({ theme: options.saved }) } : {},
  );
  TestBed.configureTestingModule({
    providers: [
      { provide: THEME_PREFERENCES_STORAGE, useValue: storage },
      { provide: COLOR_SCHEME_QUERY, useValue: fakeQuery(options.dark ?? false) },
      ...(options.account ? [{ provide: THEME_ACCOUNT, useValue: options.account }] : []),
    ],
  });
  return { store: TestBed.inject(ThemeStore), storage };
}

describe('resolveTheme', () => {
  it('follows the device in auto: Light by day, Navy at night', () => {
    expect(resolveTheme('auto', false)).toBe('light');
    expect(resolveTheme('auto', true)).toBe('navy');
    expect(resolveTheme('contrast', true)).toBe('contrast');
  });
});

describe('ThemeStore', () => {
  it('starts from the theme saved on this device, auto when there is none', () => {
    expect(setup().store.choice()).toBe('auto');
    TestBed.resetTestingModule();
    expect(setup({ saved: 'light' }).store.active()).toBe('light');
  });

  it('saves a choice on the device and on the account', async () => {
    const written: ThemeChoice[] = [];
    const account: ThemeAccount = {
      read: async () => null,
      write: async (choice) => void written.push(choice),
    };
    const { store, storage } = setup({ account });
    store.choose('contrast');
    expect(JSON.parse(storage.getItem(THEME_STORAGE_KEY)!)).toEqual({ theme: 'contrast' });
    expect(written).toEqual(['contrast']);
  });

  it("takes the account's theme over the device's once it is loaded", async () => {
    const account: ThemeAccount = { read: async () => 'contrast', write: async () => undefined };
    const { store, storage } = setup({ saved: 'light', account });
    await store.loadFromAccount();
    expect(store.choice()).toBe('contrast');
    expect(JSON.parse(storage.getItem(THEME_STORAGE_KEY)!)).toEqual({ theme: 'contrast' });
  });

  it('keeps the device theme when the account cannot be read', async () => {
    const account: ThemeAccount = {
      read: () => Promise.reject(new Error('offline')),
      write: async () => undefined,
    };
    const { store } = setup({ saved: 'navy', account });
    await store.loadFromAccount();
    expect(store.choice()).toBe('navy');
  });
});
