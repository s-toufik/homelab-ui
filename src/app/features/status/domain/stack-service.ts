export const SERVICE_GROUPS = [
  'Gateway',
  'Repository',
  'Message broker',
  'Observability',
  'AI',
  'Apps',
] as const;

export type ServiceGroup = (typeof SERVICE_GROUPS)[number];

export type ServiceCheck =
  | { readonly kind: 'health'; readonly key: string }
  | { readonly kind: 'metric'; readonly query: string };

export interface ServiceLink {
  readonly label: string;
  readonly port: number | null;
  readonly path: string;
  /** 'http' for a port published directly on the tailnet, not served by the HTTPS gateway */
  readonly scheme?: 'http';
}

export interface StackService {
  readonly id: string;
  readonly label: string;
  readonly group: ServiceGroup;
  readonly folder: string;
  readonly description: string;
  readonly check: ServiceCheck;
  readonly links: readonly ServiceLink[];
  readonly connection?: string;
}

export type ServiceState = 'checking' | 'ready' | 'not-ready' | 'unknown';

export function connectionFor(service: StackService, host: string): string | null {
  return service.connection ? service.connection.replaceAll('{host}', host) : null;
}
