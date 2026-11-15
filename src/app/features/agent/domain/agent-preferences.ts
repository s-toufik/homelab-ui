import { ORCHESTRATOR } from './agent-directory';

export interface AgentPreferences {
  agentName: string;
  modelName: string;
  autoApprove: boolean;
}

export const DEFAULT_PREFERENCES: AgentPreferences = {
  agentName: ORCHESTRATOR,
  modelName: '',
  autoApprove: false,
};
