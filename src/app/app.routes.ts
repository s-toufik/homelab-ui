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
];
