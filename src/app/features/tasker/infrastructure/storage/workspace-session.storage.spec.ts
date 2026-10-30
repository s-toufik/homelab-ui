import { TestBed } from '@angular/core/testing';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { createGroup } from '../../domain/pane-layout';
import { TASKER_LOCAL_STORAGE, WorkspaceSessionStorage } from './workspace-session.storage';

function storage(): {
  workspace: WorkspaceSessionStorage;
  local: Storage;
  session: GatewaySession;
} {
  const values = new Map<string, string>();
  const local = {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => void values.set(key, value),
    removeItem: (key: string) => void values.delete(key),
  } as Storage;
  TestBed.configureTestingModule({
    providers: [{ provide: TASKER_LOCAL_STORAGE, useValue: local }],
  });
  return {
    workspace: TestBed.inject(WorkspaceSessionStorage),
    local,
    session: TestBed.inject(GatewaySession),
  };
}

const draft = {
  layout: createGroup('pane', ['doc']),
  activeGroupId: 'pane',
  documents: [
    { id: 'doc', name: 'Mine', blocks: [], connections: [], dirty: true, persisted: false },
  ],
};

describe('WorkspaceSessionStorage', () => {
  it('keeps each signed-in user’s drafts apart', () => {
    const { workspace, local, session } = storage();

    session.user.set({ username: 'alice', email: null });
    workspace.write(draft);
    session.user.set({ username: 'bob', email: null });

    expect(workspace.read()).toBeNull();
    expect(local.getItem('homelab-ui.tasker.workspace.alice')).not.toBeNull();

    session.user.set({ username: 'alice', email: null });
    expect(workspace.read()?.documents[0].name).toBe('Mine');
  });
});
