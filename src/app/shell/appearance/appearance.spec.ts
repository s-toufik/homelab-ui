import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { memoryStorage } from '@features/agent/infrastructure/storage/memory-storage';
import { SpriteSheets } from '@features/agent/infrastructure/sprites/sprite-sheets';
import { API_ROUTING } from '@shared/infrastructure/homelab-server';
import { CENTER_ACCOUNT } from '../application/center-account';
import { CenterStyleStore } from '../application/center-style.store';
import { CENTER_STYLE_STORAGE_KEY } from '../infrastructure/center-style.storage';
import { THEME_PREFERENCES_STORAGE } from '../infrastructure/theme-preferences.storage';
import { Appearance } from './appearance';

describe('Appearance', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', () => 1);
    vi.stubGlobal('cancelAnimationFrame', () => {});
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  function render() {
    const storage = memoryStorage();
    const saved: string[] = [];
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        { provide: API_ROUTING, useValue: 'gateway' },
        { provide: THEME_PREFERENCES_STORAGE, useValue: storage },
        { provide: SpriteSheets, useValue: { load: async () => null } },
        {
          provide: CENTER_ACCOUNT,
          useValue: { read: async () => null, write: async (style: string) => saved.push(style) },
        },
      ],
    });
    const fixture = TestBed.createComponent(Appearance);
    fixture.detectChanges();
    return { fixture, storage, saved };
  }

  function centerStyles(element: HTMLElement): HTMLButtonElement[] {
    return [
      ...element.querySelectorAll<HTMLButtonElement>('[aria-label="Center styles"] [role="radio"]'),
    ];
  }

  it('offers every Center style, with the sky chosen at first', () => {
    const { fixture } = render();
    const options = centerStyles(fixture.nativeElement);

    expect(options.map((option) => option.querySelector('strong')?.textContent)).toEqual([
      'Sky',
      'Ferrofluid',
      'Atlas',
      'Starmap',
      'Contour',
    ]);
    expect(options.map((option) => option.getAttribute('aria-checked'))).toEqual([
      'true',
      'false',
      'false',
      'false',
      'false',
    ]);
  });

  it('keeps the Center style picked, here and in the account', () => {
    const { fixture, storage, saved } = render();

    centerStyles(fixture.nativeElement)[2].click();
    fixture.detectChanges();

    expect(TestBed.inject(CenterStyleStore).style()).toBe('atlas');
    expect(centerStyles(fixture.nativeElement)[2].getAttribute('aria-checked')).toBe('true');
    expect(storage.getItem(CENTER_STYLE_STORAGE_KEY)).toBe('atlas');
    expect(saved).toEqual(['atlas']);
  });
});
