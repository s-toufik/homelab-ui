import { Provider, inject } from '@angular/core';
import { provideHomelabFeature } from '@shell/application/homelab-features';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import KUBE from './infrastructure/kube.json';

export function provideKubernetesFeature(): Provider {
  return provideHomelabFeature(() => {
    const server = inject(HomelabServer);
    return {
      id: 'kubernetes',
      label: 'Kubernetes',
      description: 'Pods, workloads, logs, shells and every object of the cluster (admins).',
      category: 'Platform',
      color: '#326ce5',
      icon: ['M12 2.5 20.5 7v10L12 21.5 3.5 17V7Z', 'M12 8v8M8.5 10l7 4M15.5 10l-7 4'],
      entry: { kind: 'page', path: '/kubernetes' },
      adminOnly: true,
      checkHealth: () => server.isReachable(KUBE),
    };
  });
}
