export interface KafkaCluster {
  name: string;
  online: boolean;
  brokers: number;
  topics: number;
  onlinePartitions: number;
  version: string;
}

export interface Broker {
  id: number;
  host: string;
  port: number;
  partitions: number;
  sizeBytes: number;
}

export interface Topic {
  name: string;
  internal: boolean;
  partitions: number;
  replicationFactor: number;
  sizeBytes: number;
  messages: number;
  underReplicated: number;
  cleanupPolicy: string;
}

export interface TopicMessage {
  partition: number;
  offset: number;
  timestamp: string;
  key: string | null;
  value: string | null;
  headers: Record<string, string>;
}

export interface ConsumerGroup {
  id: string;
  state: string;
  members: number;
  topics: number;
  lag: number;
}

export interface NewTopic {
  name: string;
  partitions: number;
  replicationFactor: number;
}

export interface NewMessage {
  partition: number | null;
  key: string;
  value: string;
}
