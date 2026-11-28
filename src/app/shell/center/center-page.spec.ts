import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { memoryStorage } from '@features/agent/infrastructure/storage/memory-storage';
import { API_ROUTING } from '@shared/infrastructure/homelab-server';
import { provideHomelabFeature } from '../application/homelab-features';
import type { HomelabFeature } from '../domain/homelab-feature';
import { CENTER_STYLE_STORAGE_KEY } from '../infrastructure/center-style.storage';
import { THEME_PREFERENCES_STORAGE } from '../infrastructure/theme-preferences.storage';
import { CenterPage } from './center-page';
import {
  CENTER_SCENES,
  type CenterScene,
  type MountScene,
  type SceneEvents,
  type SceneScope,
  type SceneTarget,
} from './scenes/center-scene';

function feature(id: string, label: string, category: HomelabFeature['category']): HomelabFeature {
  return {
    id,
    label,
    description: `${label} page`,
    icon: [],
    color: '#000000',
    hue: 'green',
    category,
    entry: { kind: 'page', path: `/${id}` },
  };
}

class FakeScene implements CenterScene {
  readonly shown: SceneTarget[] = [];
  idling = false;
  disposed = false;
  show(target: SceneTarget): void {
    this.shown.push(target);
  }
  idle(on: boolean): void {
    this.idling = on;
  }
  readonly turns: [number, number][] = [];
  readonly zooms: number[] = [];
  zoom(factor: number): void {
    this.zooms.push(factor);
  }
  turn(left: number, up: number): void {
    this.turns.push([left, up]);
  }
  reset(): void {}
  dispose(): void {
    this.disposed = true;
  }
}

async function render(style: string, loader?: () => Promise<MountScene>) {
  const storage = memoryStorage();
  storage.setItem(CENTER_STYLE_STORAGE_KEY, style);
  const scene = new FakeScene();
  const mounted: { scopes: readonly SceneScope[]; events: SceneEvents }[] = [];
  const mount: MountScene = (_host, scopes, events) => {
    mounted.push({ scopes, events });
    return scene;
  };
  const load = loader ?? (async () => mount);
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: API_ROUTING, useValue: 'gateway' },
      { provide: THEME_PREFERENCES_STORAGE, useValue: storage },
      {
        provide: CENTER_SCENES,
        useValue: { ferrofluid: load, atlas: load, starmap: load, contour: load },
      },
      provideHomelabFeature(() => feature('loki', 'Logs', 'Observability')),
      provideHomelabFeature(() => feature('tasker', 'Tasker', 'Automation')),
    ],
  });
  const fixture = TestBed.createComponent(CenterPage);
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
  return { fixture, scene, mounted };
}

function chip(fixture: ComponentFixture<CenterPage>, name: string): HTMLButtonElement {
  const element: HTMLElement = fixture.nativeElement;
  return [...element.querySelectorAll<HTMLButtonElement>('.center__chip')].find((button) =>
    button.textContent?.includes(name),
  )!;
}

describe('CenterPage', () => {
  beforeEach(() => {
    vi.stubGlobal('requestAnimationFrame', () => 1);
    vi.stubGlobal('cancelAnimationFrame', () => {});
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('draws the sky by default', async () => {
    const { fixture, mounted } = await render('sky');
    const element: HTMLElement = fixture.nativeElement;

    expect(mounted).toEqual([]);
    expect(element.querySelector<HTMLCanvasElement>('.center__sky')!.hidden).toBe(false);
    expect(element.querySelector<HTMLElement>('.center__scene')!.hidden).toBe(true);
  });

  it('mounts the chosen 3D style with every scope and its pages', async () => {
    const { fixture, mounted } = await render('ferrofluid');
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector<HTMLCanvasElement>('.center__sky')!.hidden).toBe(true);
    expect(element.querySelector<HTMLElement>('.center__scene')!.hidden).toBe(false);
    const scopes = mounted[0].scopes;
    expect(scopes.map((scope) => scope.name)).toEqual(['Assistant', 'Observe', 'Automate', 'Home']);
    expect(scopes[1].parts.map((part) => part.label)).toEqual(['Logs']);
  });

  it('brings a scope forward from its chip, and lets go when it is picked again', async () => {
    const { fixture, scene } = await render('atlas');

    chip(fixture, 'Observe').click();
    fixture.detectChanges();
    expect(scene.shown.at(-1)).toEqual({ scope: 'observe', part: null });
    expect(chip(fixture, 'Observe').getAttribute('aria-pressed')).toBe('true');

    chip(fixture, 'Observe').click();
    fixture.detectChanges();
    expect(scene.shown.at(-1)).toEqual({ scope: null, part: null });
  });

  it('opens the card of a page picked in the scene, and puts it down with Escape', async () => {
    const { fixture, scene, mounted } = await render('starmap');
    const element: HTMLElement = fixture.nativeElement;

    mounted[0].events.pick('loki');
    fixture.detectChanges();
    expect(element.querySelector('.center__card h2')?.textContent).toBe('Logs');
    expect(scene.shown.at(-1)).toEqual({ scope: 'observe', part: 'loki' });

    element.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));
    fixture.detectChanges();
    expect(element.querySelector('.center__card h2')).toBeNull();
  });

  it('turns and zooms the scene from the keyboard', async () => {
    const { fixture, scene } = await render('contour');
    const host = (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>(
      '.center__scene',
    )!;

    for (const key of ['ArrowLeft', 'ArrowDown', '+', '-', 'x'])
      host.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

    expect(scene.turns).toEqual([
      [0.2, 0],
      [0, -0.12],
    ]);
    expect(scene.zooms).toEqual([1.25, 0.8]);
  });

  it('keeps the sky when the 3D style cannot start', async () => {
    const { fixture } = await render('contour', () => Promise.reject(new Error('no WebGL')));
    const element: HTMLElement = fixture.nativeElement;

    expect(element.querySelector<HTMLCanvasElement>('.center__sky')!.hidden).toBe(false);
  });

  it('puts the scene away when the page goes', async () => {
    const { fixture, scene } = await render('ferrofluid');

    fixture.destroy();

    expect(scene.disposed).toBe(true);
  });
});
