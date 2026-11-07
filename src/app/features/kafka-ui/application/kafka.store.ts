import { Injectable, computed, inject, signal } from '@angular/core';
import type {
  Broker,
  ConsumerGroup,
  KafkaCluster,
  NewMessage,
  NewTopic,
  Topic,
  TopicMessage,
} from '../domain/kafka';
import { KafkaApiService } from '../infrastructure/api/kafka-api.service';

export type KafkaTab = 'topics' | 'groups' | 'brokers';

@Injectable({ providedIn: 'root' })
export class KafkaStore {
  private readonly api = inject(KafkaApiService);

  readonly tab = signal<KafkaTab>('topics');
  readonly cluster = signal<KafkaCluster | null>(null);
  readonly brokers = signal<Broker[]>([]);
  readonly topics = signal<Topic[]>([]);
  readonly groups = signal<ConsumerGroup[]>([]);
  readonly showInternal = signal(false);
  readonly filter = signal('');
  readonly error = signal<string | null>(null);
  readonly loading = signal(false);

  readonly selected = signal<Topic | null>(null);
  readonly messages = signal<TopicMessage[]>([]);
  readonly messagesLoading = signal(false);
  readonly messagesError = signal<string | null>(null);
  readonly actionError = signal<string | null>(null);
  readonly busy = signal(false);

  readonly shownTopics = computed(() => {
    const needle = this.filter().trim().toLowerCase();
    return needle
      ? this.topics().filter((topic) => topic.name.toLowerCase().includes(needle))
      : this.topics();
  });
  readonly totalLag = computed(() => this.groups().reduce((sum, group) => sum + group.lag, 0));

  private get name(): string {
    return this.cluster()?.name ?? 'homelab';
  }

  async load(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      const clusters = await this.api.clusters();
      this.cluster.set(clusters[0] ?? null);
      const [topics, groups, brokers] = await Promise.all([
        this.api.topics(this.name, this.showInternal()),
        this.api.consumerGroups(this.name),
        this.api.brokers(this.name),
      ]);
      this.topics.set(topics);
      this.groups.set(groups);
      this.brokers.set(brokers);
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.loading.set(false);
    }
  }

  async open(topic: Topic): Promise<void> {
    this.selected.set(topic);
    this.actionError.set(null);
    await this.loadMessages();
  }

  close(): void {
    this.selected.set(null);
    this.messages.set([]);
  }

  async loadMessages(newest = true): Promise<void> {
    const topic = this.selected();
    if (!topic) return;
    this.messagesLoading.set(true);
    this.messagesError.set(null);
    try {
      this.messages.set(await this.api.messages(this.name, topic.name, 50, newest));
    } catch (error) {
      this.messagesError.set((error as Error).message);
      this.messages.set([]);
    } finally {
      this.messagesLoading.set(false);
    }
  }

  async createTopic(topic: NewTopic): Promise<boolean> {
    return this.act(async () => {
      await this.api.createTopic(this.name, topic);
      await this.load();
    });
  }

  async deleteSelected(): Promise<boolean> {
    const topic = this.selected();
    if (!topic) return false;
    return this.act(async () => {
      await this.api.deleteTopic(this.name, topic.name);
      this.close();
      await this.load();
    });
  }

  async send(message: NewMessage): Promise<boolean> {
    const topic = this.selected();
    if (!topic) return false;
    return this.act(async () => {
      await this.api.sendMessage(this.name, topic.name, message);
      await this.loadMessages();
    });
  }

  private async act(action: () => Promise<void>): Promise<boolean> {
    this.busy.set(true);
    this.actionError.set(null);
    try {
      await action();
      return true;
    } catch (error) {
      this.actionError.set((error as Error).message);
      return false;
    } finally {
      this.busy.set(false);
    }
  }
}
