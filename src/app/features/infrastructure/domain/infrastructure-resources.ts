export interface InfrastructureResource {
  id: string;
  label: string;
  color: string;
  upWhen: string;
}

export const INFRASTRUCTURE_RESOURCES: readonly InfrastructureResource[] = [
  { id: 'postgres', label: 'PostgreSQL', color: '#38bdf8', upWhen: 'pg_up' },
  { id: 'mongodb', label: 'MongoDB', color: '#22c55e', upWhen: 'mongodb_up' },
  { id: 'kafka', label: 'Kafka', color: '#e2e8f0', upWhen: 'kafka_brokers' },
];
