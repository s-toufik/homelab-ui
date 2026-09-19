import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { App } from './app';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter(routes)],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('renders the shell with the home dashboard at the root route', async () => {
    const router = TestBed.inject(Router);
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    await router.navigateByUrl('/');
    fixture.detectChanges();
    await fixture.whenStable();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('app-nav-sidebar')).toBeTruthy();
    expect(compiled.querySelector('app-home-page')).toBeTruthy();
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
  });
});
