import { Injectable, inject } from '@angular/core';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import type { ModelListing } from '../../domain/model-catalog';
import AGENT from '../agent.json';

const TIMEOUT_MS = 4000;

interface ModelListResponse {
  models: { name: string; context_tokens: number; max_output_tokens: number; thinking: boolean }[];
  pinned_steps: Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class AgentModelsService {
  private readonly server = inject(HomelabServer);

  async list(): Promise<ModelListing> {
    const response = await fetch(this.server.url(AGENT, '/v1/models'), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`The agent answered ${response.status}`);
    }
    const body = (await response.json()) as ModelListResponse;
    return {
      models: body.models.map((model) => ({
        name: model.name,
        contextTokens: model.context_tokens,
        maxOutputTokens: model.max_output_tokens,
        thinking: model.thinking,
      })),
      pinnedSteps: body.pinned_steps ?? {},
    };
  }
}
