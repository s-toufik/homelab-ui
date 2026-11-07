export interface ToolLink {
  label: string;
  port: number;
  path: string;
  scheme?: 'http';
}

export interface ToolUi {
  id: string;
  label: string;
  description: string;
  group: 'Observability' | 'Streaming' | 'AI' | 'Platform';
  healthKey: string;
  links: readonly ToolLink[];
}

export const TOOL_UIS: readonly ToolUi[] = [
  {
    id: 'grafana',
    label: 'Grafana',
    description: 'Dashboards and Explore for metrics, logs and traces; signs in with Keycloak.',
    group: 'Observability',
    healthKey: 'grafana',
    links: [
      { label: 'Dashboards', port: 3000, path: '/dashboards' },
      { label: 'Explore', port: 3000, path: '/explore' },
    ],
  },
  {
    id: 'prometheus',
    label: 'Prometheus',
    description: 'Queries, scrape targets, alerts and rules.',
    group: 'Observability',
    healthKey: 'prometheus',
    links: [
      { label: 'Query', port: 9090, path: '/query' },
      { label: 'Targets', port: 9090, path: '/targets' },
      { label: 'Alerts', port: 9090, path: '/alerts' },
    ],
  },
  {
    id: 'alloy',
    label: 'Alloy',
    description: 'The collection pipelines, their components and graph.',
    group: 'Observability',
    healthKey: 'alloy',
    links: [
      { label: 'Components', port: 12345, path: '/' },
      { label: 'Graph', port: 12345, path: '/graph' },
    ],
  },
  {
    id: 'kafka-ui',
    label: 'Kafka UI',
    description: 'Topics, messages, consumer groups and brokers.',
    group: 'Streaming',
    healthKey: 'kafka-ui',
    links: [{ label: 'Open', port: 8080, path: '/' }],
  },
  {
    id: 'llm',
    label: 'llama-swap',
    description: 'The LLM playground, loaded models and logs.',
    group: 'AI',
    healthKey: 'llm',
    links: [
      { label: 'Playground', port: 8090, path: '/ui' },
      { label: 'Loaded models', port: 8090, path: '/running' },
    ],
  },
  {
    id: 'mcp-inspector',
    label: 'MCP Inspector',
    description: 'Connect to agent-toolbox and try its tools by hand.',
    group: 'AI',
    healthKey: 'mcp-inspector',
    links: [{ label: 'Open', port: 6274, path: '/' }],
  },
  {
    id: 'agent-runtime',
    label: 'Agent API',
    description: "agent-runtime's interactive API docs, over HTTPS.",
    group: 'AI',
    healthKey: 'agent-runtime',
    links: [{ label: 'API docs', port: 8100, path: '/docs' }],
  },
  {
    id: 'headlamp',
    label: 'Headlamp',
    description:
      'The Kubernetes dashboard: resources, Helm releases, a map of the cluster (admins).',
    group: 'Platform',
    healthKey: 'headlamp',
    links: [{ label: 'Open', port: 4466, path: '/' }],
  },
  {
    id: 'keycloak',
    label: 'Keycloak',
    description: 'Your account page: password, sessions, two-factor.',
    group: 'Platform',
    healthKey: 'keycloak',
    links: [{ label: 'Your account', port: 8443, path: '/realms/homelab/account' }],
  },
];

export const TOOL_UI_GROUPS = ['Observability', 'Streaming', 'AI', 'Platform'] as const;
