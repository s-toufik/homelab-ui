import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { formatBytes } from '@shared/ui/charts/chart-format';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { type KafkaTab, KafkaStore } from '../../application/kafka.store';

@Component({
  selector: 'app-kafka-page',
  imports: [FormsModule, DatePipe, DecimalPipe, PageHeader],
  templateUrl: './kafka-page.html',
  styleUrl: './kafka-page.scss',
})
export class KafkaPage {
  protected readonly store = inject(KafkaStore);
  protected readonly isAdmin = inject(GatewaySession).isAdmin;
  protected readonly bytes = formatBytes;
  protected readonly tabs: { id: KafkaTab; label: string }[] = [
    { id: 'topics', label: 'Topics' },
    { id: 'groups', label: 'Consumer groups' },
    { id: 'brokers', label: 'Brokers' },
  ];

  protected readonly creating = signal(false);
  protected readonly newTopic = { name: '', partitions: 1, replicationFactor: 1 };
  protected readonly newMessage = { key: '', value: '', partition: null as number | null };
  protected readonly expanded = signal<string | null>(null);

  constructor() {
    void this.store.load();
  }

  protected async create(): Promise<void> {
    if (!this.newTopic.name.trim()) return;
    if (await this.store.createTopic({ ...this.newTopic, name: this.newTopic.name.trim() })) {
      this.creating.set(false);
      this.newTopic.name = '';
    }
  }

  protected async remove(): Promise<void> {
    const topic = this.store.selected();
    if (!topic) return;
    const typed = prompt(
      `This deletes topic "${topic.name}" and its messages. Type its name to confirm:`,
    );
    if (typed === topic.name) await this.store.deleteSelected();
  }

  protected async send(): Promise<void> {
    if (!this.newMessage.value) return;
    if (await this.store.send({ ...this.newMessage })) {
      this.newMessage.key = '';
      this.newMessage.value = '';
    }
  }

  protected pretty(value: string | null): string {
    if (value === null) return '';
    try {
      return JSON.stringify(JSON.parse(value), null, 2);
    } catch {
      return value;
    }
  }

  protected toggle(id: string): void {
    this.expanded.update((current) => (current === id ? null : id));
  }
}
