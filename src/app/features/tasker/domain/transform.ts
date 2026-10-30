import { getPath } from './template';
import type { TransformConfig } from './workflow';

export function applyTransform(config: TransformConfig, input: unknown): Record<string, unknown> {
  const output: Record<string, unknown> = {};
  for (const mapping of config.mappings) {
    if (mapping.to.trim() === '') continue;
    output[mapping.to] = getPath(input, mapping.from);
  }
  return output;
}
