import type { ServiceAddress } from '@shared/infrastructure/homelab-server';
import { ORCHESTRATOR } from '../../domain/agent-directory';
import AGENT from '../agent.json';

export function agentAddress(name: string): ServiceAddress {
  if (name === ORCHESTRATOR) return AGENT;
  return { ...AGENT, api: `/api/agents/${encodeURIComponent(name)}` };
}
