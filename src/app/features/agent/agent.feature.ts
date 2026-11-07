import { Provider, inject } from '@angular/core';
import { provideAssistantPanel } from '@shell/application/assistant-panel';
import { provideHomelabFeature } from '@shell/application/homelab-features';
import { AgentStore } from './application/agent.store';
import { AgentHealthService } from './infrastructure/api/agent-health.service';

export function provideAgentFeature(): Provider[] {
  return [
    provideHomelabFeature(() => {
      const health = inject(AgentHealthService);
      return {
        id: 'agent',
        label: 'Agent',
        description: 'Chat with the homelab agent.',
        category: 'AI',
        color: '#3b82f6',
        icon: [
          'M7 7h10a3 3 0 0 1 3 3v6a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3v-6a3 3 0 0 1 3-3Z',
          'M12 7V4M9 12.5h.01M15 12.5h.01M9.5 16h5',
        ],
        entry: { kind: 'page', path: '/agent' },
        checkHealth: () => health.isReady(),
      };
    }),
    provideAssistantPanel(() => ({
      load: () => import('./components/assistant/assistant').then((m) => m.Assistant),
      hiddenOn: ['/agent'],
      phase: inject(AgentStore).phase,
    })),
  ];
}
