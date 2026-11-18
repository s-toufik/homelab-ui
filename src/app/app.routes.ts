import { Routes } from '@angular/router';
import { requireAccess, requireAdmin } from '@shell/application/access.guard';

export const routes: Routes = [
  {
    path: '',
    pathMatch: 'full',
    loadComponent: () => import('./shell/center/center-page').then((m) => m.CenterPage),
  },
  {
    path: 'today',
    loadComponent: () =>
      import('./features/today/pages/today-page/today-page').then((m) => m.TodayPage),
  },
  {
    path: 'assistant',
    loadComponent: () =>
      import('./features/agent/pages/assistant-page/assistant-page').then((m) => m.AssistantPage),
  },
  {
    path: 'assistant/:id',
    loadComponent: () =>
      import('./features/agent/pages/assistant-page/assistant-page').then((m) => m.AssistantPage),
  },
  {
    path: 'agents',
    loadComponent: () =>
      import('./features/agent/pages/agents-page/agents-page').then((m) => m.AgentsPage),
  },
  { path: 'agent', redirectTo: 'assistant' },
  { path: 'agent/:name', redirectTo: ({ params }) => `/assistant?agent=${params['name']}` },
  {
    path: 'map',
    canMatch: [requireAdmin],
    loadComponent: () => import('./features/map/pages/map-page/map-page').then((m) => m.MapPage),
  },
  { path: 'more', redirectTo: '' },
  {
    path: 'people',
    canMatch: [requireAdmin],
    loadComponent: () =>
      import('./features/people/pages/people-page/people-page').then((m) => m.PeoplePage),
  },
  {
    path: 'people/new',
    canMatch: [requireAdmin],
    loadComponent: () =>
      import('./features/people/pages/new-person-page/new-person-page').then(
        (m) => m.NewPersonPage,
      ),
  },
  {
    path: 'appearance',
    loadComponent: () => import('./shell/appearance/appearance-page').then((m) => m.AppearancePage),
  },
  {
    path: 'status',
    canMatch: [requireAccess('page:status')],
    loadComponent: () =>
      import('./features/status/pages/status-page/status-page').then((m) => m.StatusPage),
  },
  {
    path: 'tasker',
    canMatch: [requireAccess('app:tasker')],
    loadComponent: () =>
      import('./features/tasker/pages/tasker-page/tasker-page').then((m) => m.TaskerPage),
  },
  {
    path: 'kitchen',
    canMatch: [requireAccess('app:kitchen')],
    loadComponent: () =>
      import('./features/kitchen/pages/kitchen-page/kitchen-page').then((m) => m.KitchenPage),
  },
  {
    path: 'metrics',
    canMatch: [requireAccess('page:metrics')],
    loadComponent: () =>
      import('./features/prometheus/pages/metrics-page/metrics-page').then((m) => m.MetricsPage),
  },
  {
    path: 'logs',
    canMatch: [requireAccess('page:logs')],
    loadComponent: () =>
      import('./features/loki/pages/logs-page/logs-page').then((m) => m.LogsPage),
  },
  {
    path: 'traces',
    canMatch: [requireAccess('page:traces')],
    loadComponent: () =>
      import('./features/tempo/pages/traces-page/traces-page').then((m) => m.TracesPage),
  },
  {
    path: 'dashboards',
    canMatch: [requireAccess('page:dashboards')],
    loadComponent: () =>
      import('./features/grafana/pages/dashboards-page/dashboards-page').then(
        (m) => m.DashboardsPage,
      ),
  },
  {
    path: 'dashboards/:id',
    canMatch: [requireAccess('page:dashboards')],
    loadComponent: () =>
      import('./features/grafana/pages/dashboards-page/dashboards-page').then(
        (m) => m.DashboardsPage,
      ),
  },
  {
    path: 'kafka',
    canMatch: [requireAccess('page:kafka')],
    loadComponent: () =>
      import('./features/kafka-ui/pages/kafka-page/kafka-page').then((m) => m.KafkaPage),
  },
  {
    path: 'pipeline',
    canMatch: [requireAccess('page:pipeline')],
    loadComponent: () =>
      import('./features/alloy/pages/pipeline-page/pipeline-page').then((m) => m.PipelinePage),
  },
  {
    path: 'models',
    canMatch: [requireAccess('page:models')],
    loadComponent: () =>
      import('./features/llm/pages/models-page/models-page').then((m) => m.ModelsPage),
  },
  {
    path: 'tools',
    canMatch: [requireAccess('page:tools')],
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
    canMatch: [requireAdmin],
    loadComponent: () =>
      import('./features/kubernetes/pages/kubernetes-page/kubernetes-page').then(
        (m) => m.KubernetesPage,
      ),
  },
  {
    path: 'tool-uis',
    canMatch: [requireAccess('page:tool-uis')],
    loadComponent: () =>
      import('./features/tool-links/pages/tool-links-page/tool-links-page').then(
        (m) => m.ToolLinksPage,
      ),
  },
  { path: '**', redirectTo: '' },
];
