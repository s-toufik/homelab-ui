import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { provideShellCommands } from '@shell/application/shell-commands';
import { ThemeStore } from '@shell/application/theme.store';
import { CastStore } from '@shell/application/cast.store';
import { CenterStyleStore } from '@shell/application/center-style.store';

import { provideAccountFeature } from '@features/account/account.feature';
import { provideAgentFeature } from '@features/agent/agent.feature';
import { provideAlloyFeature } from '@features/alloy/alloy.feature';
import { provideGrafanaFeature } from '@features/grafana/grafana.feature';
import { provideInfrastructureResources } from '@features/infrastructure/infrastructure.feature';
import { provideIssuesFeature } from '@features/issues/issues.feature';
import { provideKafkaUiFeature } from '@features/kafka-ui/kafka-ui.feature';
import { provideKitchenFeature } from '@features/kitchen/kitchen.feature';
import { provideKubernetesFeature } from '@features/kubernetes/kubernetes.feature';
import { provideLlmFeature } from '@features/llm/llm.feature';
import { provideMapFeature } from '@features/map/map.feature';
import { provideLokiFeature } from '@features/loki/loki.feature';
import { provideMcpInspectorFeature } from '@features/mcp-inspector/mcp-inspector.feature';
import { providePeopleFeature } from '@features/people/people.feature';
import { providePrometheusFeature } from '@features/prometheus/prometheus.feature';
import { provideStatusFeature } from '@features/status/status.feature';
import { provideTaskerFeature } from '@features/tasker/tasker.feature';
import { provideToolLinksFeature } from '@features/tool-links/tool-links.feature';
import { provideTempoFeature } from '@features/tempo/tempo.feature';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => {
      const session = inject(GatewaySession);
      const theme = inject(ThemeStore);
      const cast = inject(CastStore);
      const center = inject(CenterStyleStore);
      session.watch();
      return session.load().then(() => {
        void theme.loadFromAccount();
        void cast.loadFromAccount();
        void center.loadFromAccount();
      });
    }),
    provideRouter(routes),
    provideShellCommands(),
    provideMapFeature(),
    provideStatusFeature(),
    provideAccountFeature(),
    provideKubernetesFeature(),
    provideToolLinksFeature(),
    provideAgentFeature(),
    ...providePeopleFeature(),
    provideLlmFeature(),
    provideMcpInspectorFeature(),
    provideGrafanaFeature(),
    providePrometheusFeature(),
    provideLokiFeature(),
    provideTempoFeature(),
    provideAlloyFeature(),
    provideKafkaUiFeature(),
    provideTaskerFeature(),
    provideKitchenFeature(),
    provideIssuesFeature(),
    ...provideInfrastructureResources(),
  ],
};
