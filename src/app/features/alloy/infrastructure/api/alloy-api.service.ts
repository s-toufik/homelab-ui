import { Injectable, inject } from '@angular/core';
import { GatewayApi } from '@shared/infrastructure/gateway-api';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import type { ComponentHealth, PipelineComponent } from '../../domain/component';
import ALLOY from '../alloy.json';

interface ComponentResponse {
  localID: string;
  moduleID?: string;
  name: string;
  label?: string;
  health?: { state?: string; message?: string; updatedTime?: string };
  referencesTo?: string[];
  referencedBy?: string[];
}

export function toComponent(component: ComponentResponse): PipelineComponent {
  const state = component.health?.state ?? 'unknown';
  return {
    id: component.moduleID ? `${component.moduleID}/${component.localID}` : component.localID,
    name: component.name,
    label: component.label ?? '',
    health: (['healthy', 'unhealthy', 'exited'].includes(state)
      ? state
      : 'unknown') as ComponentHealth,
    message: component.health?.message ?? '',
    updated: component.health?.updatedTime ?? '',
    referencesTo: component.referencesTo ?? [],
    referencedBy: component.referencedBy ?? [],
  };
}

@Injectable({ providedIn: 'root' })
export class AlloyApiService {
  private readonly api = inject(GatewayApi);
  private readonly server = inject(HomelabServer);

  async components(): Promise<PipelineComponent[]> {
    const body = await this.api.json<ComponentResponse[]>(
      this.server.api(ALLOY, '/api/v0/web/components'),
    );
    return body.map(toComponent);
  }

  async details(id: string): Promise<unknown> {
    return this.api.json<unknown>(
      this.server.api(ALLOY, `/api/v0/web/components/${encodeURIComponent(id)}`),
    );
  }
}
