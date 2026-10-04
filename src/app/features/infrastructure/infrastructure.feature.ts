import { Provider, inject } from '@angular/core';
import { provideHomelabResource } from '@shell/application/homelab-resources';
import type { ResourceHealth } from '@shell/domain/homelab-resource';
import { INFRASTRUCTURE_RESOURCES } from './domain/infrastructure-resources';
import { PrometheusQueryService } from './infrastructure/prometheus-query.service';

export function provideInfrastructureResources(): Provider[] {
  return INFRASTRUCTURE_RESOURCES.map((resource) =>
    provideHomelabResource(() => {
      const prometheus = inject(PrometheusQueryService);
      return {
        id: resource.id,
        label: resource.label,
        color: resource.color,
        checkHealth: async (): Promise<ResourceHealth> => {
          const value = await prometheus.value(resource.upWhen);
          if (value === null) return 'unknown';
          return value >= 1 ? 'up' : 'down';
        },
      };
    }),
  );
}
