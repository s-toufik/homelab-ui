import {
  ApplicationConfig,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideRouter } from '@angular/router';
import { GatewaySession } from '@shared/infrastructure/gateway-session';

import { provideAccountFeature } from '@features/account/account.feature';
import { provideAgentFeature } from '@features/agent/agent.feature';
import { provideAlloyFeature } from '@features/alloy/alloy.feature';
import { provideGrafanaFeature } from '@features/grafana/grafana.feature';
import { provideInfrastructureResources } from '@features/infrastructure/infrastructure.feature';
import { provideKafkaUiFeature } from '@features/kafka-ui/kafka-ui.feature';
import { provideLlmFeature } from '@features/llm/llm.feature';
import { provideMcpInspectorFeature } from '@features/mcp-inspector/mcp-inspector.feature';
import { providePrometheusFeature } from '@features/prometheus/prometheus.feature';
import { provideStatusFeature } from '@features/status/status.feature';
import { provideTaskerFeature } from '@features/tasker/tasker.feature';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideAppInitializer(() => {
      const session = inject(GatewaySession);
      session.watch();
      return session.load();
    }),
    provideRouter(routes),
    provideStatusFeature(),
    provideAccountFeature(),
    provideAgentFeature(),
    provideLlmFeature(),
    provideMcpInspectorFeature(),
    provideGrafanaFeature(),
    providePrometheusFeature(),
    provideAlloyFeature(),
    provideKafkaUiFeature(),
    provideTaskerFeature(),
    ...provideInfrastructureResources(),
  ],
};
