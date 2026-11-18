import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideAgentFeature } from '@features/agent/agent.feature';
import { routes } from './app.routes';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes), provideAgentFeature()],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('opens on the Center sky, with the Today briefing at /today', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await router.navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-sidebar')).toBeTruthy();
    expect(compiled.querySelector('app-center-page')).toBeTruthy();

    await router.navigateByUrl('/today');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(compiled.querySelector('app-today-page')).toBeTruthy();
  });

  it('sends the old /agent address to the assistant, with its settings in the right panel', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await router.navigateByUrl('/agent');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-assistant-page')).toBeTruthy();
    expect(compiled.querySelector('app-page-panel')).toBeTruthy();
    expect(compiled.querySelector('app-settings-panel')).toBeTruthy();
    expect(compiled.querySelector('app-assistant-drawer')).toBeNull();
  });

  it('offers the assistant on other pages', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await router.navigateByUrl('/status');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-assistant-drawer')).toBeTruthy();
    expect(
      compiled.querySelector('[aria-label="Open the assistant beside this page"]'),
    ).toBeTruthy();
  });
});
