export type ComponentHealth = 'healthy' | 'unhealthy' | 'exited' | 'unknown';

export interface PipelineComponent {
  id: string;
  name: string;
  label: string;
  health: ComponentHealth;
  message: string;
  updated: string;
  referencesTo: string[];
  referencedBy: string[];
}

export interface ComponentGroup {
  kind: string;
  components: PipelineComponent[];
}

export function groupByKind(components: readonly PipelineComponent[]): ComponentGroup[] {
  const groups = new Map<string, PipelineComponent[]>();
  for (const component of components) {
    const kind = component.name.split('.')[0] || 'other';
    groups.set(kind, [...(groups.get(kind) ?? []), component]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([kind, list]) => ({ kind, components: list.sort((a, b) => a.id.localeCompare(b.id)) }));
}
