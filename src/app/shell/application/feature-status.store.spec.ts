import { TestBed } from '@angular/core/testing';
import type { HomelabFeature } from '../domain/homelab-feature';
import { FeatureStatusStore } from './feature-status.store';
import { provideHomelabFeature } from './homelab-features';

function feature(id: string, checkHealth?: () => Promise<boolean>): HomelabFeature {
  return {
    id,
    label: id,
    description: '',
    icon: [],
    color: '#3b82f6',
    category: 'Observability',
    entry: { kind: 'link', url: `http://host/${id}` },
    checkHealth,
  };
}

describe('FeatureStatusStore', () => {
  it('checks every feature that has a health check and sums them up', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHomelabFeature(() => feature('up', async () => true)),
        provideHomelabFeature(() => feature('down', async () => false)),
        provideHomelabFeature(() => feature('broken', () => Promise.reject(new Error('boom')))),
        provideHomelabFeature(() => feature('unchecked')),
      ],
    });
    const store = TestBed.inject(FeatureStatusStore);
    expect(store.summary()).toBeNull();

    await store.refresh();

    expect(store.statuses()).toEqual({ up: 'online', down: 'offline', broken: 'offline' });
    expect(store.summary()).toEqual({ online: 1, total: 3 });
  });
});
