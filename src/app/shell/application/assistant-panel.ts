import { InjectionToken, Provider, Signal, Type } from '@angular/core';
import type { SwarmPhase } from '@shared/ui/swarm-avatar/swarm-avatar';

export interface AssistantPanel {
  load: () => Promise<Type<unknown>>;
  hiddenOn: readonly string[];
  phase: Signal<SwarmPhase>;
}

export const ASSISTANT_PANEL = new InjectionToken<AssistantPanel>('ASSISTANT_PANEL');

export function provideAssistantPanel(describe: () => AssistantPanel): Provider {
  return { provide: ASSISTANT_PANEL, useFactory: describe };
}
