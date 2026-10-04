import { Injectable, inject } from '@angular/core';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import AGENT from '../agent.json';

const TIMEOUT_MS = 4000;

@Injectable({ providedIn: 'root' })
export class AgentHealthService {
  private readonly server = inject(HomelabServer);

  async isReady(): Promise<boolean> {
    try {
      const response = await fetch(this.server.url(AGENT, AGENT.healthPath), {
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
