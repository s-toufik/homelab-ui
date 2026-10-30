import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./features/home/pages/home-page/home-page').then((m) => m.HomePage),
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
];
