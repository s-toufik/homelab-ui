import { SUPERVISOR } from './agent-directory';

export interface AgentPreferences {
  agentName: string;
  modelName: string;
  autoApprove: boolean;
}

export const DEFAULT_PREFERENCES: AgentPreferences = {
  agentName: SUPERVISOR,
  modelName: '',
  autoApprove: false,
};
