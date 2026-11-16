import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PrometheusQueryService } from '@shared/infrastructure/prometheus-query.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { AccessStore } from '@shell/application/access.store';
import { AGENT_ORDER } from '../../agent.feature';
import { AgentStore } from '../../application/agent.store';
import { AgentScene } from '../../components/agent-scene/agent-scene';
import { activeByAgent, moodOf, phraseOf } from '../../domain/agent-activity';
import { agentLook } from '../../domain/agent-looks';

const POLL_MS = 10_000;
const ACTIVE_QUERY =
  'sum by (job, service_name) (http_server_active_requests{job=~"(.+/)?agent-.+"})';

@Component({
  selector: 'app-agents-page',
  imports: [PageHeader, RouterLink, AgentScene],
  templateUrl: './agents-page.html',
  styleUrl: './agents-page.scss',
})
export class AgentsPage {
  private readonly store = inject(AgentStore);
  private readonly access = inject(AccessStore);
  private readonly prometheus = inject(PrometheusQueryService);
  protected readonly look = agentLook;

  protected readonly server = signal<Record<string, number>>({});
  protected readonly serverKnown = signal(false);

  protected readonly agents = computed(() => {
    const known = this.store.agents().map((agent) => agent.name);
    const names = known.length ? known : [...AGENT_ORDER];
    const ordered = [
      ...AGENT_ORDER.filter((name) => names.includes(name)),
      ...names.filter((name) => !AGENT_ORDER.includes(name)),
    ].filter((name) => this.access.canUseAgent(name));
    const streaming = this.store.isStreaming() ? this.store.agentName() : null;
    return ordered.map((name) => {
      const conversations = this.store.conversations().filter((c) => c.agent === name);
      const waitingPlans = this.store.waiting().filter((c) => c.agent === name).length;
      const mood = moodOf({
        localPhase: streaming === name ? this.store.phase() : null,
        serverActive: this.server()[name] ?? 0,
        waitingPlans,
      });
      return {
        name,
        look: agentLook(name),
        mood,
        phrase: phraseOf(name, mood),
        waitingPlans,
        last: conversations[0] ?? null,
        count: conversations.length,
      };
    });
  });

  protected readonly working = computed(
    () => this.agents().filter((agent) => agent.mood === 'working').length,
  );

  constructor() {
    void this.store.loadDirectory();
    if (this.access.can('page:metrics') || this.access.can('page:dashboards')) {
      void this.poll();
      const timer = setInterval(() => void this.poll(), POLL_MS);
      inject(DestroyRef).onDestroy(() => clearInterval(timer));
    }
  }

  private async poll(): Promise<void> {
    try {
      this.server.set(activeByAgent(await this.prometheus.vector(ACTIVE_QUERY)));
      this.serverKnown.set(true);
    } catch {
      this.serverKnown.set(false);
    }
  }
}
