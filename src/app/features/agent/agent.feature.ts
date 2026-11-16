import { Provider, computed, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AccessStore } from '@shell/application/access.store';
import { provideAppSource } from '@shell/application/app-sources';
import { provideAssistantPanel } from '@shell/application/assistant-panel';
import { matches, provideCommandSource, type Command } from '@shell/application/commands';
import { provideHomelabFeature } from '@shell/application/homelab-features';
import { AgentStore } from './application/agent.store';
import { agentLook } from './domain/agent-looks';
import { AgentHealthService } from './infrastructure/api/agent-health.service';

export const AGENT_ORDER = [
  'supervisor',
  'kitchen',
  'travel',
  'observation',
  'analysis',
  'coding',
  'security',
];

export function provideAgentFeature(): Provider[] {
  return [
    provideHomelabFeature(() => {
      const health = inject(AgentHealthService);
      return {
        id: 'agent',
        hue: 'blue',
        listed: false,
        label: 'Assistant',
        description: 'Ask the homelab assistants.',
        category: 'AI',
        color: '#58a6ff',
        icon: ['M5 5h14v10H9l-4 4z'],
        entry: { kind: 'page', path: '/assistant' },
        checkHealth: () => health.isReady(),
      };
    }),
    provideAppSource(() => {
      const store = inject(AgentStore);
      return {
        apps: computed(() =>
          store.agents().map((agent) => {
            const look = agentLook(agent.name);
            return {
              id: `agent-${agent.name}`,
              label: look.label,
              tagline: agent.description || look.greeting,
              hue: look.hue,
              icon: look.icon,
              path: `/assistant?agent=${agent.name}`,
              kind: 'agent' as const,
              category: null,
              access: `agent:${agent.name}`,
            };
          }),
        ),
        load: () => store.loadDirectory(),
      };
    }),
    provideCommandSource(() => {
      const store = inject(AgentStore);
      const access = inject(AccessStore);
      const router = inject(Router);
      return {
        commands(query: string): Command[] {
          const known = store.agents().map((agent) => agent.name);
          const agents = [
            ...AGENT_ORDER.filter((name) => known.includes(name)),
            ...known.filter((name) => !AGENT_ORDER.includes(name)),
          ].filter((name) => access.canUseAgent(name));
          const ask: Command[] = query
            ? agents.slice(0, 4).map((name) => ({
                id: `ask-${name}`,
                group: 'Ask',
                label: `Ask ${agentLook(name).label}: ${query}`,
                hint: '↵',
                run: () => {
                  void store.ask(name, query);
                  void router.navigate(['/assistant', store.sessionId()]);
                },
              }))
            : [];
          const conversations: Command[] = store
            .conversations()
            .filter((c) => access.canUseAgent(c.agent))
            .filter((c) => !query || matches(query, c.title, agentLook(c.agent).label))
            .slice(0, query ? 5 : 3)
            .map((c) => ({
              id: `conversation-${c.id}`,
              group: 'Conversations',
              label: c.title,
              hint: agentLook(c.agent).label,
              run: () => void router.navigate(['/assistant', c.id]),
            }));
          const create: Command[] =
            !query || matches(query, 'new conversation')
              ? [
                  {
                    id: 'new-conversation',
                    group: 'Do',
                    label: 'New conversation',
                    run: () => void router.navigate(['/assistant', 'new']),
                  },
                ]
              : [];
          return [...ask, ...conversations, ...create];
        },
      };
    }),
    provideAssistantPanel(() => {
      const store = inject(AgentStore);
      const access = inject(AccessStore);
      return {
        load: () => import('./components/assistant/assistant').then((m) => m.Assistant),
        hiddenOn: ['/assistant', '/', '/people', '/appearance', '/more'],
        phase: store.phase,
        waiting: computed(() => store.waiting().filter((c) => access.canUseAgent(c.agent)).length),
      };
    }),
  ];
}
