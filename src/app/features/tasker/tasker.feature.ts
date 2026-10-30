import { Provider } from '@angular/core';
import { provideHomelabFeature } from '@shell/application/homelab-features';
import { BLOCK_FAVORITE_REPOSITORY, WORKFLOW_REPOSITORY } from './application/tasker-tokens';
import { CANVAS_ENGINE } from './components/canvas/canvas-engine.token';
import { PostgrestBlockFavoriteRepository } from './infrastructure/api/postgrest-block-favorite.repository';
import { PostgrestWorkflowRepository } from './infrastructure/api/postgrest-workflow.repository';

export function provideTaskerFeature(): Provider[] {
  return [
    provideHomelabFeature(() => ({
      id: 'tasker',
      label: 'Tasker',
      description: 'Build automations by connecting blocks.',
      category: 'Automation',
      color: '#8b5cf6',
      icon: ['M8 6 3 12l5 6', 'M16 6l5 6-5 6'],
      entry: { kind: 'page', path: '/tasker' },
    })),
    { provide: WORKFLOW_REPOSITORY, useExisting: PostgrestWorkflowRepository },
    { provide: BLOCK_FAVORITE_REPOSITORY, useExisting: PostgrestBlockFavoriteRepository },
    {
      provide: CANVAS_ENGINE,
      useValue: () =>
        import('./infrastructure/canvas-engine/rete-canvas-engine').then(
          (module) => new module.ReteCanvasEngine(),
        ),
    },
  ];
}
