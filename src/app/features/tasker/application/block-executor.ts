import { Injectable, inject } from '@angular/core';
import { executeGraph, groupOutput, groupSeeds } from '../domain/graph-execution';
import { applyTransform } from '../domain/transform';
import type { BlockConfig, GroupConfig } from '../domain/workflow';
import { CodeBlockRunner } from '../infrastructure/runners/code-block-runner';
import { HttpBlockRunner } from '../infrastructure/runners/http-block-runner';

@Injectable({ providedIn: 'root' })
export class BlockExecutor {
  private readonly http = inject(HttpBlockRunner);
  private readonly code = inject(CodeBlockRunner);

  execute(
    config: BlockConfig,
    input: unknown,
    outputs: ReadonlyMap<string, unknown>,
  ): Promise<unknown> {
    switch (config.kind) {
      case 'trigger':
        return Promise.resolve(null);
      case 'code':
        return this.code.run(config, input);
      case 'http':
        return this.http.run(config, outputs);
      case 'transform':
        return Promise.resolve(applyTransform(config, input));
      case 'output':
        return Promise.resolve(input);
      case 'group':
        return this.runGroup(config, input);
    }
  }

  private async runGroup(config: GroupConfig, input: unknown): Promise<unknown> {
    const { outputs, errors } = await executeGraph(config, groupSeeds(config, input), {
      execute: (block, blockInput, blockOutputs) =>
        this.execute(block.config, blockInput, blockOutputs),
    });
    const [failure] = errors.values();
    if (failure) throw new Error(`${config.name}: ${failure.message}`);
    return groupOutput(config, outputs);
  }
}
