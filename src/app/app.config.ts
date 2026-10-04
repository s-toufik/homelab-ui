import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter } from '@angular/router';

import { provideAgentFeature } from '@features/agent/agent.feature';
import { provideAlloyFeature } from '@features/alloy/alloy.feature';
import { provideGrafanaFeature } from '@features/grafana/grafana.feature';
import { provideKafkaUiFeature } from '@features/kafka-ui/kafka-ui.feature';
import { provideLlmFeature } from '@features/llm/llm.feature';
import { providePrometheusFeature } from '@features/prometheus/prometheus.feature';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideAgentFeature(),
    provideLlmFeature(),
    provideGrafanaFeature(),
    providePrometheusFeature(),
    provideAlloyFeature(),
    provideKafkaUiFeature(),
  ],
};
