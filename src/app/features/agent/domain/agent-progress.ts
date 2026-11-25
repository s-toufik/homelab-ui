export type StepState = 'done' | 'current' | 'todo' | 'stopped';
export type ToolState = 'running' | 'done' | 'failed' | 'stopped';
export type AgentRunState =
  'working' | 'answered' | 'needs_input' | 'refused' | 'failed' | 'unreachable' | 'stopped';
export type RunEnd = 'answered' | 'stopped';

export const DELEGATE_TOOL = 'delegate_tasks';

export interface PlanStep {
  readonly number: number;
  readonly action: string;
  readonly tool: string | null;
  readonly state: StepState;
}

export interface ToolRun {
  readonly callId: string;
  readonly name: string;
  readonly state: ToolState;
  readonly detail: string;
}

export interface ProgressNode {
  readonly agent: string | null;
  readonly state: AgentRunState | null;
  readonly task: string;
  readonly steps: readonly PlanStep[];
  readonly tools: readonly ToolRun[];
  readonly agents: readonly ProgressNode[];
}

export interface ProgressEvent {
  readonly kind: 'plan' | 'tool' | 'agent';
  readonly path: readonly string[];
  readonly steps?: readonly PlanStep[];
  readonly callId?: string;
  readonly name?: string;
  readonly state?: string;
  readonly detail?: string;
}

export function emptyProgress(agent: string | null = null): ProgressNode {
  return { agent, state: agent ? 'working' : null, task: '', steps: [], tools: [], agents: [] };
}

export function parseProgress(content: string): ProgressEvent | null {
  try {
    const value = JSON.parse(content) as Partial<ProgressEvent>;
    if (value.kind !== 'plan' && value.kind !== 'tool' && value.kind !== 'agent') return null;
    return {
      ...value,
      kind: value.kind,
      path: Array.isArray(value.path) ? value.path.filter((p) => typeof p === 'string') : [],
    };
  } catch {
    return null;
  }
}

export function applyProgress(root: ProgressNode, event: ProgressEvent): ProgressNode {
  return update(root, event.path, (node) => apply(node, event));
}

function update(
  node: ProgressNode,
  path: readonly string[],
  change: (node: ProgressNode) => ProgressNode,
): ProgressNode {
  if (path.length === 0) return change(node);
  const [head, ...rest] = path;
  const existing = node.agents.find((child) => child.agent === head);
  const child = update(existing ?? emptyProgress(head), rest, change);
  return {
    ...node,
    agents: existing
      ? node.agents.map((other) => (other === existing ? child : other))
      : [...node.agents, child],
  };
}

function apply(node: ProgressNode, event: ProgressEvent): ProgressNode {
  switch (event.kind) {
    case 'plan':
      return { ...node, steps: (event.steps ?? []).map(planStep) };
    case 'tool': {
      if (!event.callId || !event.name) return node;
      const state = toolState(event.state);
      const known = node.tools.find((tool) => tool.callId === event.callId);
      const run: ToolRun = {
        callId: event.callId,
        name: event.name,
        state,
        detail: state === 'done' ? event.detail || known?.detail || '' : (event.detail ?? ''),
      };
      return {
        ...node,
        tools: known
          ? node.tools.map((tool) => (tool === known ? run : tool))
          : [...node.tools, run],
      };
    }
    case 'agent': {
      if (!event.name) return node;
      return update(node, [event.name], (child) => ({
        ...child,
        state: agentState(event.state),
        task: event.state === 'working' ? (event.detail ?? child.task) : child.task,
      }));
    }
  }
}

function planStep(step: Partial<PlanStep>, index: number): PlanStep {
  return {
    number: Number(step.number) || index + 1,
    action: String(step.action ?? ''),
    tool: typeof step.tool === 'string' ? step.tool : null,
    state: step.state === 'done' || step.state === 'current' ? step.state : 'todo',
  };
}

function toolState(value: string | undefined): ToolState {
  return value === 'done' || value === 'failed' ? value : 'running';
}

function agentState(value: string | undefined): AgentRunState {
  const known: readonly AgentRunState[] = [
    'working',
    'answered',
    'needs_input',
    'refused',
    'failed',
    'unreachable',
    'stopped',
  ];
  return known.includes(value as AgentRunState) ? (value as AgentRunState) : 'working';
}

export function hasProgress(node: ProgressNode | undefined): node is ProgressNode {
  return (
    !!node && (node.agents.length > 0 || visibleTools(node).length > 0 || node.steps.length > 0)
  );
}

export function visibleTools(node: ProgressNode): readonly ToolRun[] {
  return node.tools.filter((tool) => tool.name !== DELEGATE_TOOL);
}

export function stepCount(node: ProgressNode): { done: number; total: number } {
  return {
    done: node.steps.filter((step) => step.state === 'done').length,
    total: node.steps.length,
  };
}

export function settle(node: ProgressNode, end: RunEnd = 'answered'): ProgressNode {
  const stopped = end === 'stopped';
  const unfinished = node.state === 'working' || (node.state === null && stopped);
  return {
    ...node,
    state: unfinished ? end : node.state,
    steps: node.steps.map((step) =>
      step.state === 'current' ? { ...step, state: stopped ? 'stopped' : 'done' } : step,
    ),
    tools: node.tools.map((tool) =>
      tool.state === 'running' ? { ...tool, state: stopped ? 'stopped' : 'done' } : tool,
    ),
    agents: node.agents.map((child) => settle(child, end)),
  };
}
