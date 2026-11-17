import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { PrometheusQueryService } from '@shared/infrastructure/prometheus-query.service';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { AccessStore } from '@shell/application/access.store';
import { AGENT_ORDER } from '../../agent.feature';
import { AgentStore } from '../../application/agent.store';
import { AgentScene } from '../../components/agent-scene/agent-scene';
import {
  SUPERVISOR,
  activeByAgent,
  delegationsFrom,
  delegationsInProgress,
  moodOf,
  type Delegation,
  phraseOf,
  type AgentMood,
} from '../../domain/agent-activity';
import { agentLook } from '../../domain/agent-looks';

const POLL_MS = 5_000;
const ACTIVE_QUERY =
  'sum by (job, service_name) (http_server_active_requests{job=~"(.+/)?agent-.+"})';
const DELEGATIONS_QUERY = 'sum by (job, service_name, peer) (agent_delegations_active)';
const NARROW = '(max-width: 767px)';

export interface MapPoint {
  readonly x: number;
  readonly y: number;
}

export function mapLayout(count: number, narrow: boolean): { hub: MapPoint; spots: MapPoint[] } {
  if (narrow) {
    const rows = Math.ceil(count / 2);
    const spacing = rows > 1 ? Math.min(24, 48 / (rows - 1)) : 0;
    return {
      hub: { x: 50, y: 12 },
      spots: Array.from({ length: count }, (_, i) => ({
        x: i % 2 === 0 ? 26 : 74,
        y: 38 + Math.floor(i / 2) * spacing,
      })),
    };
  }
  return {
    hub: { x: 50, y: 50 },
    spots: Array.from({ length: count }, (_, i) => {
      const angle = (-90 + (360 / Math.max(1, count)) * i) * (Math.PI / 180);
      return { x: 50 + 38 * Math.cos(angle), y: 50 + 34 * Math.sin(angle) };
    }),
  };
}

export function linkPath(from: MapPoint, to: MapPoint): string {
  const midX = (from.x + to.x) / 2;
  const midY = (from.y + to.y) / 2;
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const bend = 0.12;
  return `M${from.x} ${from.y}Q${midX - dy * bend} ${midY + dx * bend} ${to.x} ${to.y}`;
}

export function gutterPath(from: MapPoint, to: MapPoint): string {
  const side = to.x < 50 ? 48 : 52;
  return `M50 ${from.y}L50 ${to.y}L${side} ${to.y}`;
}

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

  protected readonly server = signal<Record<string, number>>({});
  protected readonly serverDelegations = signal<Delegation[]>([]);
  protected readonly serverKnown = signal(false);

  private readonly delegationList = computed<Delegation[]>(() => {
    const local = this.store.isStreaming()
      ? delegationsInProgress(
          this.store.agentName(),
          [...this.store.messages()].reverse().find((m) => m.role === 'assistant')?.progress,
        )
      : [];
    const all = [...this.serverDelegations()];
    for (const delegation of local) {
      if (!all.some((d) => d.from === delegation.from && d.to === delegation.to))
        all.push(delegation);
    }
    return all;
  });

  protected readonly asking = computed(
    () =>
      new Set(
        this.delegationList()
          .filter((delegation) => delegation.from === SUPERVISOR)
          .map((delegation) => delegation.to),
      ),
  );
  protected readonly narrow = signal(globalThis.matchMedia?.(NARROW).matches ?? false);
  protected readonly selectedName = signal<string | null>(null);

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
      const mood: AgentMood = moodOf({
        localPhase: streaming === name ? this.store.phase() : null,
        serverActive:
          (this.server()[name] ?? 0) +
          this.delegationList().filter((delegation) => delegation.to === name).length,
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

  protected readonly hub = computed(() => this.agents().find((a) => a.name === SUPERVISOR) ?? null);
  protected readonly helpers = computed(() => this.agents().filter((a) => a.name !== SUPERVISOR));

  protected readonly map = computed(() => {
    const { hub, spots } = mapLayout(this.helpers().length, this.narrow());
    return {
      hub,
      nodes: this.helpers().map((agent, i) => ({
        agent,
        at: spots[i],
        path: this.narrow() ? gutterPath(hub, spots[i]) : linkPath(hub, spots[i]),
        mid: {
          x: (hub.x + spots[i].x) / 2,
          y: (hub.y + spots[i].y) / 2,
        },
        active: this.asking().has(agent.name),
      })),
    };
  });

  protected readonly selected = computed(() => {
    const name = this.selectedName() ?? this.hub()?.name ?? this.agents()[0]?.name;
    return this.agents().find((agent) => agent.name === name) ?? null;
  });

  protected readonly working = computed(
    () => this.agents().filter((agent) => agent.mood === 'working').length,
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    void this.store.loadDirectory();
    const media = globalThis.matchMedia?.(NARROW);
    const onMedia = (event: MediaQueryListEvent) => this.narrow.set(event.matches);
    media?.addEventListener?.('change', onMedia);
    destroyRef.onDestroy(() => media?.removeEventListener?.('change', onMedia));
    if (this.access.can('page:metrics') || this.access.can('page:dashboards')) {
      void this.poll();
      const timer = setInterval(() => void this.poll(), POLL_MS);
      destroyRef.onDestroy(() => clearInterval(timer));
    }
  }

  protected stateLabel(mood: AgentMood, asked = false): string {
    if (asked) return this.narrow() ? 'asked by Assistant' : 'asked';
    return {
      working: 'working',
      waiting: 'waiting for you',
      trouble: 'needs a look',
      idle: 'resting',
    }[mood];
  }

  private async poll(): Promise<void> {
    const [active, delegated] = await Promise.allSettled([
      this.prometheus.vector(ACTIVE_QUERY),
      this.prometheus.vector(DELEGATIONS_QUERY),
    ]);
    if (active.status === 'fulfilled') this.server.set(activeByAgent(active.value));
    this.serverDelegations.set(
      delegated.status === 'fulfilled' ? delegationsFrom(delegated.value) : [],
    );
    this.serverKnown.set(active.status === 'fulfilled' || delegated.status === 'fulfilled');
  }
}
