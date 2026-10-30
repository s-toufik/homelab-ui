import { Injectable, computed, inject, signal } from '@angular/core';
import { STACK_SERVICES } from '../domain/stack-services';
import { SERVICE_GROUPS, type ServiceState, type StackService } from '../domain/stack-service';
import { StackHealthService } from '../infrastructure/stack-health.service';

@Injectable({ providedIn: 'root' })
export class StackStatusStore {
  private readonly health = inject(StackHealthService);

  readonly services: readonly StackService[] = STACK_SERVICES;
  readonly states = signal<Readonly<Record<string, ServiceState>>>({});
  readonly checkedAt = signal<Date | null>(null);
  readonly refreshing = signal(false);

  readonly groups = SERVICE_GROUPS.map((group) => ({
    group,
    services: this.services.filter((service) => service.group === group),
  })).filter((section) => section.services.length > 0);

  readonly summary = computed(() => {
    const states = this.services.map((service) => this.states()[service.id]);
    return {
      ready: states.filter((state) => state === 'ready').length,
      notReady: states.filter((state) => state === 'not-ready').length,
      unknown: states.filter((state) => state === 'unknown').length,
      total: this.services.length,
    };
  });

  async refresh(): Promise<void> {
    if (this.refreshing()) return;
    this.refreshing.set(true);
    if (this.checkedAt() === null) {
      this.states.set(Object.fromEntries(this.services.map((service) => [service.id, 'checking'])));
    }
    const results = await Promise.all(
      this.services.map(async (service) => [service.id, await this.health.check(service.check)]),
    );
    this.states.set(Object.fromEntries(results));
    this.checkedAt.set(new Date());
    this.refreshing.set(false);
  }
}
