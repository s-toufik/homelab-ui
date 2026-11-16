import { vi } from 'vitest';
import { PEEK_CLOSE_DELAY, PEEK_OPEN_DELAY, PaneState, clampPaneWidth } from './pane-state';

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

function pane(storage = memoryStorage(), pinned = false): PaneState {
  return new PaneState({ key: 'test.pane', width: 300, min: 200, max: 500, pinned, storage });
}

describe('PaneState', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('peeks after a short hover and hides after the pointer leaves', () => {
    const state = pane();
    state.hover(true);
    expect(state.open()).toBe(false);
    vi.advanceTimersByTime(PEEK_OPEN_DELAY);
    expect(state.open()).toBe(true);

    state.hover(false);
    vi.advanceTimersByTime(PEEK_CLOSE_DELAY - 10);
    expect(state.open()).toBe(true);
    state.hover(true);
    vi.advanceTimersByTime(PEEK_CLOSE_DELAY);
    expect(state.open()).toBe(true);

    state.hover(false);
    vi.advanceTimersByTime(PEEK_CLOSE_DELAY);
    expect(state.open()).toBe(false);
  });

  it('stays open once pinned, and a second click closes it', () => {
    const storage = memoryStorage();
    const state = pane(storage);
    state.togglePin();
    state.hover(false);
    vi.advanceTimersByTime(PEEK_CLOSE_DELAY);
    expect(state.open()).toBe(true);
    expect(storage.getItem('test.pane.pinned')).toBe('true');

    state.togglePin();
    expect(state.open()).toBe(false);
    expect(storage.getItem('test.pane.pinned')).toBe('false');
  });

  it('starts from the saved pin and width, and keeps the width in bounds', () => {
    const storage = memoryStorage({ 'test.pane.pinned': 'true', 'test.pane.width': '420' });
    const state = pane(storage);
    expect([state.pinned(), state.width()]).toEqual([true, 420]);

    state.resize(900);
    state.saveWidth();
    expect(storage.getItem('test.pane.width')).toBe('500');
    expect(clampPaneWidth(10, 200, 500)).toBe(200);
  });

  it('uses the default pin when nothing was saved', () => {
    expect(pane(memoryStorage(), true).pinned()).toBe(true);
  });
});
