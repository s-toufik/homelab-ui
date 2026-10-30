import { Injectable, inject } from '@angular/core';
import { AgentApiService } from '@features/agent/infrastructure/api/agent-api.service';
import { AgentPreferencesStorage } from '@features/agent/infrastructure/storage/agent-preferences.storage';
import { newId } from '@shared/utils/uuid';
import type { CodeConfig } from '../../domain/workflow';

export interface AgentHelper {
  ask(message: string): Promise<string>;
}

@Injectable({ providedIn: 'root' })
export class CodeBlockRunner {
  private readonly api = inject(AgentApiService);
  private readonly preferences = inject(AgentPreferencesStorage);

  async run(config: CodeConfig, input: unknown): Promise<unknown> {
    const agent: AgentHelper = { ask: (message) => this.askAgent(message) };
    const fn = new Function('input', 'agent', `return (async () => { ${config.script} })();`);
    return fn(input, agent);
  }

  private async askAgent(message: string): Promise<string> {
    const { modelName, autoApprove } = this.preferences.read();
    const controller = new AbortController();
    let content = '';

    const events = this.api.stream(
      {
        message,
        model_name: modelName,
        request_id: newId(),
        auto_approve: autoApprove,
      },
      controller.signal,
    );

    for await (const event of events) {
      if (event.type === 'final') content = event.content;
      if (event.type === 'error') throw new Error(event.content);
    }

    return content;
  }
}
