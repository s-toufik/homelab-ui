import { TestBed } from '@angular/core/testing';
import {
  ASSISTANT_WIDTH_KEY,
  LAYOUT_STORAGE,
  LayoutStore,
  clampAssistantWidth,
} from './layout.store';

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

function store(storage: Storage): LayoutStore {
  TestBed.configureTestingModule({ providers: [{ provide: LAYOUT_STORAGE, useValue: storage }] });
  return TestBed.inject(LayoutStore);
}

describe('LayoutStore assistant', () => {
  it('keeps the width between 320 px and 80% of the window', () => {
    expect(clampAssistantWidth(100, 1000)).toBe(320);
    expect(clampAssistantWidth(500, 1000)).toBe(500);
    expect(clampAssistantWidth(5000, 1000)).toBe(800);
  });

  it('opening the assistant closes the settings panel, and the other way round', () => {
    const ui = store(memoryStorage());
    ui.togglePanel();
    ui.toggleAssistant();
    expect([ui.panelPinned(), ui.assistantOpen()]).toEqual([false, true]);
    ui.togglePanel();
    expect([ui.panelPinned(), ui.assistantOpen()]).toEqual([true, false]);
  });

  it('starts from the saved width and remembers a new one', () => {
    const storage = memoryStorage({ [ASSISTANT_WIDTH_KEY]: '480' });
    const ui = store(storage);
    expect(ui.assistantWidth()).toBe(480);

    ui.resizeAssistant(520);
    ui.saveAssistantWidth();
    expect(storage.getItem(ASSISTANT_WIDTH_KEY)).toBe('520');
  });
});
