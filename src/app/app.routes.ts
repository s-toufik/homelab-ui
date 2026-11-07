import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/control-center/pages/control-center-page/control-center-page').then(
        (m) => m.ControlCenterPage,
      ),
  },
  {
    path: 'agent',
    loadComponent: () =>
      import('./features/agent/pages/agent-page/agent-page').then((m) => m.AgentPage),
  },
  {
    path: 'status',
    loadComponent: () =>
      import('./features/status/pages/status-page/status-page').then((m) => m.StatusPage),
  },
  {
    path: 'tasker',
    loadComponent: () =>
      import('./features/tasker/pages/tasker-page/tasker-page').then((m) => m.TaskerPage),
  },
  {
    path: 'metrics',
    loadComponent: () =>
      import('./features/prometheus/pages/metrics-page/metrics-page').then((m) => m.MetricsPage),
  },
  {
    path: 'logs',
    loadComponent: () =>
      import('./features/loki/pages/logs-page/logs-page').then((m) => m.LogsPage),
  },
  {
    path: 'traces',
    loadComponent: () =>
      import('./features/tempo/pages/traces-page/traces-page').then((m) => m.TracesPage),
  },
  {
    path: 'dashboards',
    loadComponent: () =>
      import('./features/grafana/pages/dashboards-page/dashboards-page').then(
        (m) => m.DashboardsPage,
      ),
  },
  {
    path: 'dashboards/:id',
    loadComponent: () =>
      import('./features/grafana/pages/dashboards-page/dashboards-page').then(
        (m) => m.DashboardsPage,
      ),
  },
  {
    path: 'kafka',
    loadComponent: () =>
      import('./features/kafka-ui/pages/kafka-page/kafka-page').then((m) => m.KafkaPage),
  },
  {
    path: 'pipeline',
    loadComponent: () =>
      import('./features/alloy/pages/pipeline-page/pipeline-page').then((m) => m.PipelinePage),
  },
  {
    path: 'models',
    loadComponent: () =>
      import('./features/llm/pages/models-page/models-page').then((m) => m.ModelsPage),
  },
  {
    path: 'tools',
    loadComponent: () =>
      import('./features/mcp-inspector/pages/tools-page/tools-page').then((m) => m.ToolsPage),
  },
  {
    path: 'account',
    loadComponent: () =>
      import('./features/account/pages/account-page/account-page').then((m) => m.AccountPage),
  },
  {
    path: 'kubernetes',
    loadComponent: () =>
      import('./features/kubernetes/pages/kubernetes-page/kubernetes-page').then(
        (m) => m.KubernetesPage,
      ),
  },
  {
    path: 'tool-uis',
    loadComponent: () =>
      import('./features/tool-links/pages/tool-links-page/tool-links-page').then(
        (m) => m.ToolLinksPage,
      ),
  },
];
