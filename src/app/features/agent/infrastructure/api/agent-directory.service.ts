import { Injectable, inject } from '@angular/core';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import { SUPERVISOR, type AgentProfile } from '../../domain/agent-directory';
import { agentAddress } from './agent-address';

const TIMEOUT_MS = 4000;

interface AgentListResponse {
  agents: { name: string; description: string; skills: AgentProfile['skills'] }[];
}

@Injectable({ providedIn: 'root' })
export class AgentDirectoryService {
  private readonly server = inject(HomelabServer);

  async list(): Promise<AgentProfile[]> {
    const response = await fetch(this.server.api(agentAddress(SUPERVISOR), '/v1/agents'), {
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!response.ok) {
      throw new Error(`The supervisor answered ${response.status}`);
    }
    const body = (await response.json()) as AgentListResponse;
    return body.agents.map((agent) => ({
      name: agent.name,
      description: agent.description,
      skills: agent.skills.map(({ id, name, description }) => ({ id, name, description })),
    }));
  }
}
