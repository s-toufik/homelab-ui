import { DecimalPipe } from '@angular/common';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { RouterLink, provideRouter } from '@angular/router';
import { PageChromeStore } from '@shell/application/page-chrome.store';
import { ScrollLockDirective } from '@shared/ui/scroll-lock/scroll-lock.directive';
import { RecipeEditorStore } from '../../application/recipe-editor.store';
import { blankDraft, type RecipeVersion } from '../../domain/recipe';
import { RecipeRepository } from '../../infrastructure/api/recipe.repository';
import { KitchenPage } from './kitchen-page';

type Callback = (entries: { target: Element }[]) => void;

class FakeResizeObserver {
  static last: FakeResizeObserver | null = null;
  readonly targets: Element[] = [];

  constructor(readonly callback: Callback) {
    FakeResizeObserver.last = this;
  }

  observe(target: Element): void {
    this.targets.push(target);
  }

  disconnect(): void {}
}

function render(): ComponentFixture<KitchenPage> {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: RecipeRepository, useValue: { list: () => new Promise(() => {}) } },
    ],
  });
  // The child cards have their own stores and APIs; this spec is about the page's own chrome.
  TestBed.overrideComponent(KitchenPage, {
    set: { imports: [DecimalPipe, RouterLink, ScrollLockDirective], schemas: [NO_ERRORS_SCHEMA] },
  });
  const fixture = TestBed.createComponent(KitchenPage);
  fixture.detectChanges();
  return fixture;
}

function button(fixture: ComponentFixture<KitchenPage>, label: string): HTMLElement | undefined {
  const element: HTMLElement = fixture.nativeElement;
  return [...element.querySelectorAll<HTMLElement>('button, a')].find(
    (candidate) =>
      candidate.getAttribute('aria-label') === label || candidate.textContent?.trim() === label,
  );
}

function version(versionNumber: number): RecipeVersion {
  const zero = { kcal: 0, proteinG: 0, carbG: 0, fatG: 0, weightGrams: 0 };
  return {
    recipeId: 'r1',
    versionNumber,
    savedAt: '2026-11-26T10:00:00Z',
    draft: { ...blankDraft(), title: `v${versionNumber}` },
    nutritionPerPortion: zero,
    nutritionTotal: zero,
  };
}

describe('KitchenPage', () => {
  let phone = true;
  const listeners: (() => void)[] = [];

  beforeEach(() => {
    phone = true;
    listeners.length = 0;
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    vi.stubGlobal('scrollTo', () => {});
    vi.stubGlobal('matchMedia', () => ({
      get matches() {
        return phone;
      },
      addEventListener: (_: string, listener: () => void) => listeners.push(listener),
      removeEventListener: () => {},
    }));
  });
  afterEach(() => vi.unstubAllGlobals());

  it('opens the recipe actions from ⋯ and closes them with Esc', () => {
    const fixture = render();
    const element: HTMLElement = fixture.nativeElement;

    button(fixture, 'More recipe actions')!.click();
    fixture.detectChanges();
    const sheet = element.querySelector('[role="dialog"]');
    expect(sheet?.getAttribute('aria-labelledby')).toBe('kitchen-sheet-title');
    const actions = [...sheet!.querySelectorAll('.kitchen-sheet__item')].map((item) =>
      item.textContent?.trim(),
    );
    expect(actions).toEqual([
      'New recipe',
      'Copy recipe sheet',
      'Saved recipes',
      'Ingredient catalog',
    ]);

    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(element.querySelector('[role="dialog"]')).toBeNull();
  });

  it('closes the sheet once an action runs', () => {
    const fixture = render();
    const store = TestBed.inject(RecipeEditorStore);
    store.updateDraft({ title: 'Jus de veau' });

    button(fixture, 'More recipe actions')!.click();
    fixture.detectChanges();
    button(fixture, 'New recipe')!.click();
    fixture.detectChanges();

    expect(store.draft().title).toBe('');
    expect(fixture.nativeElement.querySelector('[role="dialog"]')).toBeNull();
  });

  it('turns Save into Fork to edit while an older version is shown', () => {
    const fixture = render();
    const store = TestBed.inject(RecipeEditorStore);
    expect(button(fixture, 'Fork to edit')).toBeUndefined();
    expect(fixture.nativeElement.querySelector('app-version-history')).toBeTruthy();

    store.recipeId.set('r1');
    store.versions.set([version(1), version(2)]);
    store.viewingVersionNumber.set(1);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('app-version-history')).toBeNull();
    button(fixture, 'Fork to edit')!.click();

    expect(store.isEditingLatest()).toBe(true);
    expect(store.draft().title).toBe('v1');
  });

  it('tells the shell how tall the bottom bar is, and frees the space on leaving', () => {
    const fixture = render();
    const chrome = TestBed.inject(PageChromeStore);
    const actions: HTMLElement = fixture.nativeElement.querySelector('.kitchen-actions');
    actions.getBoundingClientRect = () => ({ height: 64 }) as DOMRect;

    const observer = FakeResizeObserver.last!;
    expect(observer.targets).toContain(actions);
    observer.callback([{ target: actions }]);
    fixture.detectChanges();
    expect(chrome.bottomInset()).toBe(64);
    expect(fixture.nativeElement.style.getPropertyValue('--kitchen-dock-height')).toBe('64px');

    fixture.destroy();
    expect(chrome.bottomInset()).toBe(0);
  });

  it('reserves no bottom space once the actions move back into the header', () => {
    const fixture = render();
    const chrome = TestBed.inject(PageChromeStore);
    const actions: HTMLElement = fixture.nativeElement.querySelector('.kitchen-actions');
    actions.getBoundingClientRect = () => ({ height: 64 }) as DOMRect;
    FakeResizeObserver.last!.callback([{ target: actions }]);
    expect(chrome.bottomInset()).toBe(64);

    phone = false;
    listeners.forEach((listener) => listener());
    expect(chrome.bottomInset()).toBe(0);
  });
});
