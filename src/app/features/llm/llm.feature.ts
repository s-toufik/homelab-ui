import { Provider, inject } from '@angular/core';
import { provideHomelabFeature } from '@shell/application/homelab-features';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import LLM from './infrastructure/llm.json';

export function provideLlmFeature(): Provider {
  return provideHomelabFeature(() => {
    const server = inject(HomelabServer);
    return {
      id: 'llm',
      label: 'Models',
      description: 'llama-swap: loaded models, logs and a playground.',
      category: 'AI',
      color: '#8b5cf6',
      icon: [
        'M8 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2Z',
        'M9 2v4M15 2v4M9 18v4M15 18v4M2 9h4M2 15h4M18 9h4M18 15h4',
      ],
      entry: { kind: 'link', url: server.url(LLM) },
      checkHealth: () => server.isReachable(LLM),
    };
  });
}
