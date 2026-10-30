import { isBlockKind, type BlockKind } from './block-kind';

export interface HttpHeader {
  readonly key: string;
  readonly value: string;
}

export interface TriggerConfig {
  readonly kind: 'trigger';
}

export interface CodeConfig {
  readonly kind: 'code';
  readonly script: string;
}

export interface HttpConfig {
  readonly kind: 'http';
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  readonly url: string;
  readonly headers: readonly HttpHeader[];
  readonly body: string;
}

export interface FieldMapping {
  readonly from: string;
  readonly to: string;
}

export interface TransformConfig {
  readonly kind: 'transform';
  readonly mappings: readonly FieldMapping[];
}

export interface OutputConfig {
  readonly kind: 'output';
}

export interface GroupConfig {
  readonly kind: 'group';
  readonly name: string;
  readonly blocks: readonly WorkflowBlock[];
  readonly connections: readonly WorkflowConnection[];
  readonly inputIds: readonly string[];
  readonly outputIds: readonly string[];
}

export type BlockConfig =
  TriggerConfig | CodeConfig | HttpConfig | TransformConfig | OutputConfig | GroupConfig;

export interface WorkflowBlock {
  readonly id: string;
  readonly x: number;
  readonly y: number;
  readonly config: BlockConfig;
}

export interface WorkflowConnection {
  readonly id: string;
  readonly fromId: string;
  readonly toId: string;
}

export interface WorkflowGraph {
  readonly blocks: readonly WorkflowBlock[];
  readonly connections: readonly WorkflowConnection[];
}

export interface WorkflowDocument extends WorkflowGraph {
  readonly id: string;
  readonly name: string;
}

export interface WorkflowSummary {
  readonly id: string;
  readonly name: string;
  readonly updatedAt: string;
}

export type BlockStatus = 'idle' | 'running' | 'success' | 'error';

export interface BlockResult {
  readonly status: BlockStatus;
  readonly output?: unknown;
  readonly error?: string;
}

export const UNTITLED_WORKFLOW = 'Untitled workflow';

export function defaultConfig(kind: BlockKind): BlockConfig {
  switch (kind) {
    case 'trigger':
      return { kind: 'trigger' };
    case 'code':
      return { kind: 'code', script: 'return input;' };
    case 'http':
      return { kind: 'http', method: 'GET', url: '', headers: [], body: '' };
    case 'transform':
      return { kind: 'transform', mappings: [] };
    case 'output':
      return { kind: 'output' };
    case 'group':
      return {
        kind: 'group',
        name: 'Group',
        blocks: [],
        connections: [],
        inputIds: [],
        outputIds: [],
      };
  }
}

export function sanitizeGraph(raw: { blocks?: unknown; connections?: unknown }): WorkflowGraph {
  const blocks = (Array.isArray(raw.blocks) ? raw.blocks : []).filter(
    (block: WorkflowBlock) => typeof block?.id === 'string' && isBlockKind(block?.config?.kind),
  ) as WorkflowBlock[];
  const ids = new Set(blocks.map((block) => block.id));
  const connections = (Array.isArray(raw.connections) ? raw.connections : []).filter(
    (connection: WorkflowConnection) => ids.has(connection?.fromId) && ids.has(connection?.toId),
  ) as WorkflowConnection[];
  return { blocks, connections };
}
