export type ModelState = 'ready' | 'starting' | 'stopping' | 'stopped';

export interface LlmModel {
  id: string;
  name: string;
  description: string;
  state: ModelState;
}

export interface PromptAnswer {
  text: string;
  promptTokens: number;
  completionTokens: number;
  seconds: number;
}
