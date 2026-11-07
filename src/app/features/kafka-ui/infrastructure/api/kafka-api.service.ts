import { Injectable, inject } from '@angular/core';
import { GatewayApi } from '@shared/infrastructure/gateway-api';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import type {
  Broker,
  ConsumerGroup,
  KafkaCluster,
  NewMessage,
  NewTopic,
  Topic,
  TopicMessage,
} from '../../domain/kafka';
import KAFKA_UI from '../kafka-ui.json';

interface ClusterResponse {
  name: string;
  status?: string;
  brokerCount?: number;
  topicCount?: number;
  onlinePartitionCount?: number;
  version?: string;
}

interface BrokerResponse {
  id: number;
  host: string;
  port: number;
}

interface BrokerDiskResponse {
  brokerId: number;
  segmentSize?: number;
}

interface TopicResponse {
  name: string;
  internal?: boolean;
  partitionCount?: number;
  replicationFactor?: number;
  segmentSize?: number;
  underReplicatedPartitions?: number;
  cleanUpPolicy?: string;
  partitions?: { offsetMax?: number; offsetMin?: number }[];
}

interface ConsumerGroupResponse {
  groupId: string;
  state?: string;
  members?: number;
  topics?: number;
  consumerLag?: number;
  messagesBehind?: number;
}

interface MessageEvent {
  type: string;
  message?: {
    partition: number;
    offset: number;
    timestamp: string;
    key?: string | null;
    content?: string | null;
    headers?: Record<string, string>;
  };
}

export function toTopic(topic: TopicResponse): Topic {
  return {
    name: topic.name,
    internal: !!topic.internal,
    partitions: topic.partitionCount ?? topic.partitions?.length ?? 0,
    replicationFactor: topic.replicationFactor ?? 0,
    sizeBytes: topic.segmentSize ?? 0,
    messages: (topic.partitions ?? []).reduce(
      (sum, partition) =>
        sum + Math.max((partition.offsetMax ?? 0) - (partition.offsetMin ?? 0), 0),
      0,
    ),
    underReplicated: topic.underReplicatedPartitions ?? 0,
    cleanupPolicy: topic.cleanUpPolicy ?? '',
  };
}

export function toGroup(group: ConsumerGroupResponse): ConsumerGroup {
  return {
    id: group.groupId,
    state: group.state ?? 'UNKNOWN',
    members: group.members ?? 0,
    topics: group.topics ?? 0,
    lag: group.consumerLag ?? group.messagesBehind ?? 0,
  };
}

export function parseMessageStream(text: string): TopicMessage[] {
  const messages: TopicMessage[] = [];
  for (const line of text.split('\n')) {
    if (!line.startsWith('data:')) continue;
    try {
      const event = JSON.parse(line.slice(5).trim()) as MessageEvent;
      if (event.type !== 'MESSAGE' || !event.message) continue;
      messages.push({
        partition: event.message.partition,
        offset: event.message.offset,
        timestamp: event.message.timestamp,
        key: event.message.key ?? null,
        value: event.message.content ?? null,
        headers: event.message.headers ?? {},
      });
    } catch {
      continue;
    }
  }
  return messages;
}

@Injectable({ providedIn: 'root' })
export class KafkaApiService {
  private readonly api = inject(GatewayApi);
  private readonly server = inject(HomelabServer);

  private url(path: string): string {
    return this.server.api(KAFKA_UI, `/api/clusters${path}`);
  }

  async clusters(): Promise<KafkaCluster[]> {
    const body = await this.api.json<ClusterResponse[]>(this.url(''));
    return body.map((cluster) => ({
      name: cluster.name,
      online: cluster.status === 'online',
      brokers: cluster.brokerCount ?? 0,
      topics: cluster.topicCount ?? 0,
      onlinePartitions: cluster.onlinePartitionCount ?? 0,
      version: cluster.version ?? '',
    }));
  }

  async brokers(cluster: string): Promise<Broker[]> {
    const c = encodeURIComponent(cluster);
    const [brokers, disks] = await Promise.all([
      this.api.json<BrokerResponse[]>(this.url(`/${c}/brokers`)),
      this.api.json<BrokerDiskResponse[]>(this.url(`/${c}/stats/brokers`)).catch(() => []),
    ]);
    return brokers.map((broker) => ({
      id: broker.id,
      host: broker.host,
      port: broker.port,
      partitions: 0,
      sizeBytes: disks.find((disk) => disk.brokerId === broker.id)?.segmentSize ?? 0,
    }));
  }

  async topics(cluster: string, showInternal: boolean): Promise<Topic[]> {
    const params = new URLSearchParams({
      page: '1',
      perPage: '500',
      showInternal: `${showInternal}`,
    });
    const body = await this.api.json<{ topics?: TopicResponse[] }>(
      this.url(`/${encodeURIComponent(cluster)}/topics?${params}`),
    );
    return (body.topics ?? []).map(toTopic).sort((a, b) => a.name.localeCompare(b.name));
  }

  async topic(cluster: string, name: string): Promise<Topic> {
    return toTopic(
      await this.api.json<TopicResponse>(
        this.url(`/${encodeURIComponent(cluster)}/topics/${encodeURIComponent(name)}`),
      ),
    );
  }

  async messages(
    cluster: string,
    topic: string,
    limit = 50,
    newest = true,
  ): Promise<TopicMessage[]> {
    const params = new URLSearchParams({ mode: newest ? 'LATEST' : 'EARLIEST', limit: `${limit}` });
    const text = await this.api.text(
      this.url(
        `/${encodeURIComponent(cluster)}/topics/${encodeURIComponent(topic)}/messages/v2?${params}`,
      ),
      { accept: 'text/event-stream', timeoutMs: 30_000 },
    );
    return parseMessageStream(text);
  }

  async consumerGroups(cluster: string): Promise<ConsumerGroup[]> {
    const params = new URLSearchParams({ page: '1', perPage: '500' });
    const body = await this.api.json<{ consumerGroups?: ConsumerGroupResponse[] }>(
      this.url(`/${encodeURIComponent(cluster)}/consumer-groups/paged?${params}`),
    );
    return (body.consumerGroups ?? [])
      .map(toGroup)
      .sort((a, b) => b.lag - a.lag || a.id.localeCompare(b.id));
  }

  async createTopic(cluster: string, topic: NewTopic): Promise<void> {
    await this.api.json(this.url(`/${encodeURIComponent(cluster)}/topics`), {
      method: 'POST',
      body: {
        name: topic.name,
        partitions: topic.partitions,
        replicationFactor: topic.replicationFactor,
        configs: {},
      },
    });
  }

  async deleteTopic(cluster: string, topic: string): Promise<void> {
    await this.api.json(
      this.url(`/${encodeURIComponent(cluster)}/topics/${encodeURIComponent(topic)}`),
      {
        method: 'DELETE',
      },
    );
  }

  async sendMessage(cluster: string, topic: string, message: NewMessage): Promise<void> {
    await this.api.json(
      this.url(`/${encodeURIComponent(cluster)}/topics/${encodeURIComponent(topic)}/messages`),
      {
        method: 'POST',
        body: {
          partition: message.partition ?? 0,
          key: message.key || null,
          value: message.value,
          keySerde: 'String',
          valueSerde: 'String',
          headers: {},
        },
      },
    );
  }
}
