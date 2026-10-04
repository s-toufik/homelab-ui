import { TestBed } from '@angular/core/testing';
import { HOMELAB_FEATURES } from '@shell/application/homelab-features';
import { appConfig } from './app.config';
import { routes } from './app.routes';

describe('appConfig', () => {
  it('registers features with unique ids, and every page has a route', () => {
    TestBed.configureTestingModule({ providers: appConfig.providers });
    const features = TestBed.inject(HOMELAB_FEATURES);
    const ids = features.map((feature) => feature.id);
    const routed = new Set(routes.map((route) => `/${route.path}`));

    expect(new Set(ids).size).toBe(ids.length);
    for (const feature of features) {
      if (feature.entry.kind === 'page') expect(routed).toContain(feature.entry.path);
    }
  });
});
