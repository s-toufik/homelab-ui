import type { Hue } from '@shell/domain/homelab-feature';

export type Glyph =
  | 'gate'
  | 'user'
  | 'app'
  | 'agent'
  | 'tool'
  | 'model'
  | 'db'
  | 'queue'
  | 'chart'
  | 'logs'
  | 'trace'
  | 'job'
  | 'kube';
export type Workload =
  'Deployment' | 'StatefulSet' | 'DaemonSet' | 'CronJob' | 'Job' | 'Cluster' | 'Deployments';

export interface MapService {
  readonly id: string;
  readonly glyph: Glyph;
  readonly summary: string;
  readonly address: string;
  readonly description: string;
  readonly reach: readonly string[];
  readonly workload: Workload;
  readonly page?: string;
}

export interface MapCategory {
  readonly title: string;
  readonly hue: Hue;
  readonly services: readonly MapService[];
}

const s = (
  id: string,
  glyph: Glyph,
  summary: string,
  address: string,
  description: string,
  reach: string[],
  workload: Workload = 'Deployment',
  page?: string,
): MapService => ({ id, glyph, summary, address, description, reach, workload, page });

export const CATEGORIES: readonly MapCategory[] = [
  {
    title: 'Gateway & security',
    hue: 'orange',
    services: [
      s(
        'caddy',
        'gate',
        'HTTPS, routes, page checks',
        ':443 · :8443 · :3000',
        'The front door: HTTPS with the tailnet certificate, every /api route, and the sign-in and page check on each request.',
        ['https://<server>.ts.net (:443)', ':8443, :3000, :8090 and the tool ports'],
      ),
      s(
        'oauth2-proxy',
        'user',
        'sessions and groups',
        '/oauth2/*',
        'Keeps the session cookie and answers caddy\'s "may this person open this?" with their groups.',
        ['/oauth2/* through caddy'],
      ),
      s(
        'keycloak',
        'user',
        'accounts, one role per page',
        ':8443 sign-in',
        'Accounts, passwords and one realm role per page.',
        [':8443 sign-in pages', '/api/account, /api/people'],
        'Deployment',
        '/people',
      ),
      s(
        'kube-api',
        'kube',
        'Kubernetes API, admins',
        '/api/kube',
        'The Kubernetes API for admins, behind the gateway.',
        ['/api/kube'],
        'Deployment',
        '/kubernetes',
      ),
      s('headlamp', 'kube', 'cluster dashboard', ':4466', 'The cluster dashboard, admins only.', [
        ':4466',
      ]),
    ],
  },
  {
    title: 'Apps',
    hue: 'blue',
    services: [
      s(
        'homelab-ui',
        'app',
        'this app',
        '/',
        'This app: one static page served by nginx.',
        ['/ through caddy'],
        'Deployment',
        '/',
      ),
      s(
        'agent-supervisor',
        'agent',
        'plans, hands work out',
        ':8000 · /api/agent',
        'Understands a request, plans it, and hands each step to the agent that fits.',
        ['/api/agent', ':8000 on the tailnet'],
        'Deployment',
        '/assistant',
      ),
      s(
        'agents',
        'agent',
        'one pod per agent',
        '/api/agents/<name>',
        'observation, analysis, coding, security, kitchen and travel: one pod each, the same image, their own folder.',
        ['/api/agents/<name>'],
        'Deployments',
        '/assistant',
      ),
      s(
        'agent-toolbox',
        'tool',
        "the agents' tools",
        ':8001/mcp',
        "The agents' tools, published by scope over MCP.",
        [':8001/mcp on the tailnet', '/api/toolbox'],
        'Deployment',
        '/tools',
      ),
    ],
  },
  {
    title: 'LLM & tools',
    hue: 'purple',
    services: [
      s(
        'llm',
        'model',
        'llama-swap, local models',
        ':8090 · /api/llm',
        'Local models behind an OpenAI-compatible API.',
        ['/api/llm', ':8090'],
        'Deployment',
        '/models',
      ),
      s(
        'llm-sd',
        'model',
        'loaded models → Prometheus',
        'llm-sd:8000',
        'Tells Prometheus which models are loaded.',
        ['inside the cluster'],
      ),
      s('grafana-mcp', 'tool', 'Grafana as tools', 'MCP', 'Grafana as MCP tools for the toolbox.', [
        'inside the cluster',
      ]),
      s(
        'postgres-mcp',
        'tool',
        'PostgreSQL, read-only',
        'MCP',
        'PostgreSQL as MCP tools, read-only.',
        ['inside the cluster'],
      ),
      s('mongodb-mcp', 'tool', 'MongoDB, read-only', 'MCP', 'MongoDB as MCP tools, read-only.', [
        'inside the cluster',
      ]),
      s(
        'mcp-inspector',
        'tool',
        'try the tools by hand',
        ':6274',
        "Try the toolbox's tools by hand.",
        [':6274'],
        'Deployment',
        '/tools',
      ),
    ],
  },
  {
    title: 'Data & messaging',
    hue: 'green',
    services: [
      s(
        'postgres',
        'db',
        'CloudNativePG · 3 databases',
        'postgres-rw:5432',
        'Databases homelab, keycloak and agent-runtime.',
        ['postgres-rw:5432, inside'],
        'Cluster',
      ),
      s(
        'postgrest',
        'db',
        "Tasker's REST API",
        '/api/tasker',
        "Tasker's workflows over REST; each person sees only their rows.",
        ['/api/tasker'],
        'Deployment',
        '/tasker',
      ),
      s(
        'mongodb',
        'db',
        'documents',
        'mongodb:27017',
        'Documents for the apps.',
        ['mongodb:27017 on the tailnet'],
        'StatefulSet',
      ),
      s(
        'kafka',
        'queue',
        'KRaft, one broker',
        'kafka:9092',
        'Messages between apps.',
        ['<server>:9094 on the tailnet'],
        'StatefulSet',
        '/kafka',
      ),
      s(
        'kafka-ui',
        'queue',
        'topics, consumer lag',
        ':8080 · /api/kafka',
        'Topics, messages, consumer lag.',
        [':8080', '/api/kafka'],
        'Deployment',
        '/kafka',
      ),
      s(
        'backups',
        'job',
        'CronJob · every night',
        'nightly',
        'Dumps PostgreSQL and MongoDB every night.',
        ['runs on its schedule'],
        'CronJob',
      ),
      s(
        'db-migrate',
        'job',
        'Job · on each release',
        'on release',
        'Applies database changes on each release.',
        ['runs on release'],
        'Job',
      ),
    ],
  },
  {
    title: 'Observability',
    hue: 'teal',
    services: [
      s(
        'prometheus',
        'chart',
        'metrics and alerts',
        ':9090',
        'Metrics and alert rules.',
        [':9090', '/api/prometheus'],
        'Deployment',
        '/metrics',
      ),
      s(
        'loki',
        'logs',
        "every container's logs",
        ':3100',
        "Every container's logs.",
        [':3100', '/api/loki'],
        'Deployment',
        '/logs',
      ),
      s(
        'tempo',
        'trace',
        'request traces',
        ':3200',
        'Request traces.',
        [':3200', '/api/tempo'],
        'Deployment',
        '/traces',
      ),
      s(
        'alloy',
        'logs',
        'collects logs',
        ':12345',
        'Collects container logs for Loki.',
        [':12345', '/api/alloy'],
        'DaemonSet',
        '/pipeline',
      ),
      s(
        'otel-collector',
        'trace',
        'OTLP in',
        ':4317 · :4318',
        'Receives traces and metrics over OTLP.',
        [':4317, :4318 on the tailnet'],
      ),
      s(
        'grafana',
        'chart',
        'dashboards',
        ':3000',
        'Dashboards over Prometheus, Loki and Tempo.',
        [':3000'],
        'Deployment',
        '/dashboards',
      ),
      s('kafka-exporter', 'chart', 'Kafka metrics', ':9308', 'Kafka metrics for Prometheus.', [
        ':9308',
      ]),
      s(
        'mongodb-exporter',
        'chart',
        'MongoDB metrics',
        'exporter',
        'MongoDB metrics for Prometheus.',
        ['inside the cluster'],
      ),
    ],
  },
];

export const OUTSIDE = { provider: 'LLM provider' } as const;

export const CONNECTIONS: readonly (readonly [string, string])[] = [
  ['caddy', 'oauth2-proxy'],
  ['caddy', 'homelab-ui'],
  ['caddy', 'keycloak'],
  ['caddy', 'agent-supervisor'],
  ['caddy', 'agents'],
  ['caddy', 'agent-toolbox'],
  ['caddy', 'postgrest'],
  ['caddy', 'prometheus'],
  ['caddy', 'loki'],
  ['caddy', 'tempo'],
  ['caddy', 'alloy'],
  ['caddy', 'kafka-ui'],
  ['caddy', 'llm'],
  ['caddy', 'kube-api'],
  ['caddy', 'grafana'],
  ['caddy', 'headlamp'],
  ['caddy', 'mcp-inspector'],
  ['oauth2-proxy', 'keycloak'],
  ['keycloak', 'postgres'],
  ['postgrest', 'postgres'],
  ['headlamp', 'kube-api'],
  ['agent-supervisor', 'agents'],
  ['agent-supervisor', 'provider'],
  ['agents', 'provider'],
  ['agents', 'agent-toolbox'],
  ['agent-supervisor', 'postgres'],
  ['agents', 'postgres'],
  ['agent-toolbox', 'grafana-mcp'],
  ['agent-toolbox', 'mongodb-mcp'],
  ['agent-toolbox', 'postgres-mcp'],
  ['agent-toolbox', 'provider'],
  ['grafana-mcp', 'grafana'],
  ['mongodb-mcp', 'mongodb'],
  ['postgres-mcp', 'postgres'],
  ['mcp-inspector', 'agent-toolbox'],
  ['llm-sd', 'llm'],
  ['prometheus', 'llm-sd'],
  ['prometheus', 'kafka-exporter'],
  ['prometheus', 'mongodb-exporter'],
  ['kafka-exporter', 'kafka'],
  ['mongodb-exporter', 'mongodb'],
  ['kafka-ui', 'kafka'],
  ['alloy', 'loki'],
  ['otel-collector', 'tempo'],
  ['otel-collector', 'prometheus'],
  ['grafana', 'prometheus'],
  ['grafana', 'loki'],
  ['grafana', 'tempo'],
  ['backups', 'postgres'],
  ['backups', 'mongodb'],
  ['db-migrate', 'postgres'],
];

export interface TailnetPort {
  readonly port: string;
  readonly name: string;
  readonly detail: string;
  readonly https: boolean;
  readonly services: readonly string[];
}

export const PORTS: readonly TailnetPort[] = [
  {
    port: '443',
    name: 'homelab',
    detail: 'every page and API',
    https: true,
    services: ['caddy', 'homelab-ui'],
  },
  { port: '8443', name: 'sign-in', detail: 'Keycloak', https: true, services: ['keycloak'] },
  {
    port: '3000',
    name: 'Grafana',
    detail: 'dashboards, own sign-in',
    https: true,
    services: ['grafana'],
  },
  {
    port: '8090',
    name: 'LLM API',
    detail: 'OpenAI-compatible, key or session',
    https: true,
    services: ['llm'],
  },
  {
    port: '8000',
    name: 'agents',
    detail: 'agent-supervisor API',
    https: false,
    services: ['agent-supervisor'],
  },
  {
    port: '8001',
    name: 'tools',
    detail: 'agent-toolbox over MCP',
    https: false,
    services: ['agent-toolbox'],
  },
  {
    port: '9090',
    name: 'Prometheus',
    detail: 'queries, signed in',
    https: true,
    services: ['prometheus'],
  },
  { port: '4466', name: 'Headlamp', detail: 'admins only', https: true, services: ['headlamp'] },
];

export interface Network {
  readonly name: string;
  readonly detail: string;
  readonly range: string;
  readonly hue: Hue;
}

export const NETWORKS: readonly Network[] = [
  {
    name: 'Tailnet',
    detail: 'your devices · MagicDNS · HTTPS',
    range: '100.64.0.0/10',
    hue: 'blue',
  },
  { name: 'Pods', detail: 'one address per pod', range: '10.42.0.0/16', hue: 'green' },
  {
    name: 'Services',
    detail: 'stable names: postgres-rw, kafka…',
    range: '10.43.0.0/16',
    hue: 'purple',
  },
  { name: 'Host ports', detail: ':8000 agents, :8001 tools', range: 'hostPort', hue: 'orange' },
  { name: 'Outbound', detail: 'LLM provider, image pulls', range: 'internet', hue: 'rose' },
];

export const AGENT_RELEASES = [
  'observation',
  'analysis',
  'coding',
  'security',
  'kitchen',
  'travel',
].map((name) => `agent-${name}`);

export function serviceById(id: string): MapService | undefined {
  return CATEGORIES.flatMap((category) => category.services).find((service) => service.id === id);
}

export function categoryOf(id: string): MapCategory | undefined {
  return CATEGORIES.find((category) => category.services.some((service) => service.id === id));
}

export function neighbours(id: string): { out: string[]; used: string[] } {
  return {
    out: CONNECTIONS.filter(([a]) => a === id).map(([, b]) => b),
    used: CONNECTIONS.filter(([, b]) => b === id).map(([a]) => a),
  };
}
