export type ResourceHealth = 'up' | 'down' | 'unknown';

export interface HomelabResource {
  id: string;
  label: string;
  color: string;
  checkHealth: () => Promise<ResourceHealth>;
}
