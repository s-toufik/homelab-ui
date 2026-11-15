export interface AgentSkill {
  id: string;
  name: string;
  description: string;
}

export interface AgentProfile {
  name: string;
  description: string;
  skills: AgentSkill[];
}

export const ORCHESTRATOR = 'orchestration';
