import type { ServiceAddress } from '@shared/infrastructure/homelab-server';
import AGENT from '@features/agent/infrastructure/agent.json';
import ALLOY from '@features/alloy/infrastructure/alloy.json';
import GRAFANA from '@features/grafana/infrastructure/grafana.json';
import KAFKA_UI from '@features/kafka-ui/infrastructure/kafka-ui.json';
import LLM from '@features/llm/infrastructure/llm.json';
import PROMETHEUS from '@features/prometheus/infrastructure/prometheus.json';

export interface ConnectableService {
  readonly key: string;
  readonly label: string;
  readonly default: ServiceAddress;
}

export const CONNECTABLE_SERVICES: readonly ConnectableService[] = [
  { key: 'agent', label: 'Agent', default: AGENT },
  { key: 'grafana', label: 'Grafana', default: GRAFANA },
  { key: 'prometheus', label: 'Prometheus', default: PROMETHEUS },
  { key: 'alloy', label: 'Alloy', default: ALLOY },
  { key: 'kafka-ui', label: 'Kafka UI', default: KAFKA_UI },
  { key: 'llm', label: 'Models (llama-swap)', default: LLM },
];
