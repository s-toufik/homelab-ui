import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { type DetailTab, KubernetesStore } from '../../application/kubernetes.store';
import { canRestart, canScale } from '../../domain/resources';
import { PodLogs } from '../pod-logs/pod-logs';
import { PodTerminal } from '../pod-terminal/pod-terminal';

@Component({
  selector: 'app-object-detail',
  imports: [FormsModule, DatePipe, PodLogs, PodTerminal],
  templateUrl: './object-detail.html',
  styleUrl: './object-detail.scss',
})
export class ObjectDetail {
  protected readonly store = inject(KubernetesStore);
  protected readonly current = computed(() => this.store.selected());
  protected readonly isPod = computed(() => this.current()?.resource.id === 'pods');
  protected readonly canScale = computed(
    () => !!this.current() && canScale(this.current()!.resource),
  );
  protected readonly canRestart = computed(
    () => !!this.current() && canRestart(this.current()!.resource),
  );
  protected readonly isCronJob = computed(() => this.current()?.resource.id === 'cronjobs');
  protected readonly containers = computed<string[]>(() =>
    (this.current()?.object.spec?.['containers'] ?? []).map((c: { name: string }) => c.name),
  );
  protected readonly container = signal('');
  protected readonly replicas = signal(1);
  protected readonly yamlText = signal('');
  protected readonly revealed = signal<ReadonlySet<string>>(new Set());

  protected readonly tabs = computed<{ id: DetailTab; label: string }[]>(() => [
    { id: 'overview', label: 'Overview' },
    { id: 'yaml', label: 'YAML' },
    ...(this.isPod()
      ? [
          { id: 'logs' as const, label: 'Logs' },
          { id: 'shell' as const, label: 'Shell' },
        ]
      : []),
    { id: 'events', label: `Events (${this.store.related().length})` },
  ]);

  protected readonly conditions = computed<
    { type: string; status: string; reason?: string; message?: string }[]
  >(() => this.current()?.object.status?.['conditions'] ?? []);
  protected readonly containerStatuses = computed<any[]>(
    () => this.current()?.object.status?.['containerStatuses'] ?? [],
  );
  protected readonly labels = computed(() =>
    Object.entries(this.current()?.object.metadata.labels ?? {}),
  );
  protected readonly dataKeys = computed(() => Object.keys(this.current()?.object.data ?? {}));

  constructor() {
    effect(() => {
      const current = this.current();
      if (!current) return;
      this.yamlText.set(this.store.yaml(current.object));
      this.replicas.set(current.object.spec?.['replicas'] ?? 1);
      const names = this.containers();
      if (!names.includes(this.container())) this.container.set(names[0] ?? '');
    });
  }

  protected value(key: string): string {
    const raw = this.current()?.object.data?.[key] ?? '';
    if (this.current()?.resource.id !== 'secrets') return raw;
    if (!this.revealed().has(key)) return '••••••••';
    try {
      return new TextDecoder().decode(Uint8Array.from(atob(raw), (c) => c.charCodeAt(0)));
    } catch {
      return raw;
    }
  }

  protected toggleReveal(key: string): void {
    this.revealed.update((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  protected async scale(): Promise<void> {
    const name = this.current()?.object.metadata.name;
    if (confirm(`Scale ${name} to ${this.replicas()} replica(s)?`))
      await this.store.scale(this.replicas());
  }

  protected async restart(): Promise<void> {
    if (
      confirm(`Restart ${this.current()?.object.metadata.name}? Its pods are replaced one by one.`)
    )
      await this.store.restart();
  }

  protected async remove(): Promise<void> {
    const current = this.current();
    if (!current) return;
    const typed = prompt(
      `Delete ${current.resource.kind} "${current.object.metadata.name}"? Type its name to confirm:`,
    );
    if (typed === current.object.metadata.name) await this.store.remove();
  }

  protected async save(): Promise<void> {
    if (confirm('Replace this object with the YAML above?'))
      await this.store.saveYaml(this.yamlText());
  }
}
