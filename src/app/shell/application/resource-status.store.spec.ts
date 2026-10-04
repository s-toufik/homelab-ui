import { TestBed } from '@angular/core/testing';
import type { ResourceHealth } from '../domain/homelab-resource';
import { provideHomelabResource } from './homelab-resources';
import { ResourceStatusStore } from './resource-status.store';

function resource(id: string, checkHealth: () => Promise<ResourceHealth>) {
  return provideHomelabResource(() => ({ id, label: id, color: '#3b82f6', checkHealth }));
}

describe('ResourceStatusStore', () => {
  it('keeps what each resource reports, and unknown when its check fails', async () => {
    TestBed.configureTestingModule({
      providers: [
        resource('postgres', async () => 'up'),
        resource('mongodb', async () => 'down'),
        resource('kafka', () => Promise.reject(new Error('boom'))),
      ],
    });
    const store = TestBed.inject(ResourceStatusStore);

    await store.refresh();

    expect(store.statuses()).toEqual({ postgres: 'up', mongodb: 'down', kafka: 'unknown' });
  });
});
