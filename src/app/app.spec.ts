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

  it('renders the shell with the control center at the root route', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await router.navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-nav-sidebar')).toBeTruthy();
    expect(compiled.querySelector('app-control-center-page')).toBeTruthy();
  });

  it('renders the agent page, with its settings in the right panel, at /agent', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await router.navigateByUrl('/agent');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-agent-page')).toBeTruthy();
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
    expect(compiled.querySelector('[aria-label="Open the assistant"]')).toBeTruthy();
  });
});
