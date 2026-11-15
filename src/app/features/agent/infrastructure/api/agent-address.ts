import type { ServiceAddress } from '@shared/infrastructure/homelab-server';
import { SUPERVISOR } from '../../domain/agent-directory';
import AGENT from '../agent.json';

export function agentAddress(name: string): ServiceAddress {
  if (name === SUPERVISOR) return AGENT;
  return { ...AGENT, api: `/api/agents/${encodeURIComponent(name)}` };
}
