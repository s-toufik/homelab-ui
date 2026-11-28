import { TestBed } from '@angular/core/testing';
import { memoryStorage } from '@features/agent/infrastructure/storage/memory-storage';
import type { CenterStyleId } from '../domain/center-style';
import { CENTER_STYLE_STORAGE_KEY } from '../infrastructure/center-style.storage';
import { THEME_PREFERENCES_STORAGE } from '../infrastructure/theme-preferences.storage';
import { CENTER_ACCOUNT, type CenterAccount } from './center-account';
import { CenterStyleStore } from './center-style.store';

function setup(saved: CenterStyleId | null = null, stored: string | null = null) {
  const storage = memoryStorage();
  if (stored) storage.setItem(CENTER_STYLE_STORAGE_KEY, stored);
  const written: CenterStyleId[] = [];
  const account: CenterAccount = {
    read: async () => saved,
    write: async (style) => void written.push(style),
  };
  TestBed.configureTestingModule({
    providers: [
      { provide: THEME_PREFERENCES_STORAGE, useValue: storage },
      { provide: CENTER_ACCOUNT, useValue: account },
    ],
  });
  return { store: TestBed.inject(CenterStyleStore), storage, written };
}

describe('CenterStyleStore', () => {
  it('starts on the sky, then keeps a chosen style on the device and the account', () => {
    const { store, storage, written } = setup();
    expect(store.style()).toBe('sky');

    store.choose('ferrofluid');

    expect(store.style()).toBe('ferrofluid');
    expect(storage.getItem(CENTER_STYLE_STORAGE_KEY)).toBe('ferrofluid');
    expect(written).toEqual(['ferrofluid']);
  });

  it('ignores a stored value it does not know', () => {
    const { store } = setup(null, 'hologram');

    expect(store.style()).toBe('sky');
  });

  it('takes the style saved on the account', async () => {
    const { store, storage } = setup('atlas');

    await store.loadFromAccount();

    expect(store.style()).toBe('atlas');
    expect(storage.getItem(CENTER_STYLE_STORAGE_KEY)).toBe('atlas');
  });
});
