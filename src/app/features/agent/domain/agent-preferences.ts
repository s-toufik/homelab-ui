export interface AgentPreferences {
  modelName: string;
  autoApprove: boolean;
}

export const DEFAULT_PREFERENCES: AgentPreferences = { modelName: '', autoApprove: false };
