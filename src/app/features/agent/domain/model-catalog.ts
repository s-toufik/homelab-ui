export interface AgentModel {
  name: string;
  contextTokens: number;
  maxOutputTokens: number;
  thinking: boolean;
}

export interface ModelListing {
  models: readonly AgentModel[];
  pinnedSteps: Readonly<Record<string, string>>;
}

export const NO_MODELS: ModelListing = { models: [], pinnedSteps: {} };
