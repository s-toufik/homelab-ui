import { Provider, inject } from '@angular/core';
import { provideHomelabFeature } from '@shell/application/homelab-features';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import TOOLBOX from './infrastructure/toolbox.json';

export function provideMcpInspectorFeature(): Provider {
  return provideHomelabFeature(() => {
    const server = inject(HomelabServer);
    return {
      id: 'mcp-inspector',
      label: 'Tools',
      description: "List and try the agent's tools (agent-toolbox, MCP).",
      category: 'AI',
      color: '#14b8a6',
      icon: ['M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14Z', 'm21 21-5-5', 'M8 11h6M11 8v6'],
      entry: { kind: 'page', path: '/tools' },
      checkHealth: () => server.isReachable(TOOLBOX),
    };
  });
}
