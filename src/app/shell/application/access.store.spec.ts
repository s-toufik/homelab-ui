import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, provideRouter, type Route, type UrlSegment } from '@angular/router';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { API_ROUTING } from '@shared/infrastructure/homelab-server';
import type { HomelabFeature } from '../domain/homelab-feature';
import { requireAccess, requireAdmin } from './access.guard';
import { AccessStore } from './access.store';
import { provideHomelabFeature } from './homelab-features';

function feature(id: string, extra: Partial<HomelabFeature> = {}): HomelabFeature {
  return {
    id,
    label: id,
    description: '',
    icon: [],
    color: '#000000',
    hue: 'slate',
    category: 'Platform',
    entry: { kind: 'page', path: `/${id}` },
    ...extra,
  };
}

function setup(groups: string[]) {
  TestBed.configureTestingModule({
    providers: [
      provideRouter([]),
      { provide: API_ROUTING, useValue: 'gateway' },
      provideHomelabFeature(() => feature('tasker', { access: 'app:tasker' })),
      provideHomelabFeature(() => feature('metrics', { access: 'page:metrics' })),
      provideHomelabFeature(() => feature('kubernetes', { adminOnly: true })),
      provideHomelabFeature(() => feature('account')),
      provideHomelabFeature(() => feature('agent', { listed: false })),
    ],
  });
  TestBed.inject(GatewaySession).groups.set(groups);
  return TestBed.inject(AccessStore);
}

function run(guard: ReturnType<typeof requireAccess>, path = ''): unknown {
  const segments = path
    .split('/')
    .filter(Boolean)
    .map((part) => ({ path: part }) as UrlSegment);
  return TestBed.runInInjectionContext(() => guard({} as Route, segments));
}

describe('AccessStore', () => {
  it('shows a person only the pages they were given, plus the ones everyone has', () => {
    const access = setup(['role:app:tasker', 'role:agent:kitchen']);
    expect(access.features().map((f) => f.id)).toEqual(['tasker', 'account']);
    expect([access.canUseAgent('kitchen'), access.canUseAgent('travel')]).toEqual([true, false]);
  });

  it('gives an admin every page, admin-only ones included', () => {
    const access = setup(['role:admin']);
    expect(access.features().map((f) => f.id)).toEqual([
      'tasker',
      'metrics',
      'kubernetes',
      'account',
    ]);
    expect(access.canUseAgent('travel')).toBe(true);
  });

  it('never lets a non-admin into an admin-only page, whatever roles they have', () => {
    const access = setup(['role:page:metrics']);
    expect(access.canUse({ adminOnly: true, access: 'page:metrics' })).toBe(false);
  });
});

describe('access guards', () => {
  it('sends a person home from a page they were not given', () => {
    setup(['role:agent:kitchen']);
    const home = TestBed.inject(Router).createUrlTree(['/']);
    expect(run(requireAccess('page:metrics'))).toEqual(home);
    expect(run(requireAdmin)).toBeInstanceOf(UrlTree);
  });
});
