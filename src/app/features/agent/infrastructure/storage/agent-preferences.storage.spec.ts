import { TestBed } from '@angular/core/testing';
import { AgentPreferencesStorage, PREFERENCES_STORAGE } from './agent-preferences.storage';
import { memoryStorage } from './memory-storage';

function storageWith(entries: Record<string, string> = {}): {
  service: AgentPreferencesStorage;
  storage: Storage;
} {
  const storage = memoryStorage(entries);
  TestBed.configureTestingModule({
    providers: [{ provide: PREFERENCES_STORAGE, useValue: storage }],
  });
  return { service: TestBed.inject(AgentPreferencesStorage), storage };
}

describe('AgentPreferencesStorage', () => {
  it('starts from the defaults when nothing is saved', () => {
    expect(storageWith().service.read()).toEqual({
      agentName: 'supervisor',
      modelName: '',
      autoApprove: false,
    });
  });

  it('reads back what it wrote', () => {
    const { service } = storageWith();

    service.write({ agentName: 'observation', modelName: 'big-model', autoApprove: true });

    expect(service.read()).toEqual({
      agentName: 'observation',
      modelName: 'big-model',
      autoApprove: true,
    });
  });

  it('falls back to the supervisor when no agent was saved', () => {
    const { service } = storageWith({
      'homelab-ui.agent.preferences': JSON.stringify({ modelName: 'm', autoApprove: true }),
    });

    expect(service.read().agentName).toBe('supervisor');
  });

  it('ignores a corrupted entry', () => {
    const { service } = storageWith({ 'homelab-ui.agent.preferences': '{not json' });

    expect(service.read()).toEqual({
      agentName: 'supervisor',
      modelName: '',
      autoApprove: false,
    });
  });

  it('works without any storage at all', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: PREFERENCES_STORAGE, useValue: null }],
    });
    const service = TestBed.inject(AgentPreferencesStorage);

    service.write({ agentName: 'observation', modelName: 'x', autoApprove: true });

    expect(service.read()).toEqual({
      agentName: 'supervisor',
      modelName: '',
      autoApprove: false,
    });
  });
});
