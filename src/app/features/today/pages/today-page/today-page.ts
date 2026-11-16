import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AgentStore } from '@features/agent/application/agent.store';
import { agentLook } from '@features/agent/domain/agent-looks';
import { ControlCenterStore } from '@features/control-center/application/control-center.store';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { AccessStore } from '@shell/application/access.store';
import { FeatureStatusStore } from '@shell/application/feature-status.store';
import { briefing, dateLine, displayName, greeting } from '../../domain/briefing';

@Component({
  selector: 'app-today-page',
  imports: [RouterLink, DecimalPipe, DatePipe],
  templateUrl: './today-page.html',
  styleUrl: './today-page.scss',
})
export class TodayPage {
  protected readonly access = inject(AccessStore);
  private readonly session = inject(GatewaySession);
  private readonly agents = inject(AgentStore);
  protected readonly homelab = inject(ControlCenterStore);
  private readonly status = inject(FeatureStatusStore);
  protected readonly look = agentLook;

  private readonly now = new Date();
  protected readonly date = dateLine(this.now).toUpperCase();
  protected readonly hello = computed(() =>
    greeting(this.now, displayName(this.session.user()?.username)),
  );

  protected readonly waiting = computed(() =>
    this.agents.waiting().filter((c) => this.access.canUseAgent(c.agent)),
  );
  protected readonly recent = computed(() =>
    this.agents
      .conversations()
      .filter((c) => this.access.canUseAgent(c.agent) && !this.waiting().includes(c))
      .slice(0, 4),
  );
  protected readonly gauges = computed(() => {
    const g = this.homelab.gauges();
    return [
      { label: 'CPU', value: g.cpu },
      { label: 'Memory', value: g.memory },
      { label: 'Disk', value: g.disk },
    ];
  });
  protected readonly online = computed(() => this.status.summary());

  protected readonly sentences = computed(() =>
    briefing({
      waiting: this.waiting().map((c) => ({ agent: agentLook(c.agent).label })),
      homelab: this.access.isAdmin()
        ? {
            online: this.online()?.online ?? 0,
            total: this.online()?.total ?? 0,
            alerts: this.homelab.alerts().length,
            warnings: this.homelab.warnings(),
          }
        : null,
    }),
  );

  constructor() {
    void this.agents.loadDirectory();
    if (this.access.isAdmin()) {
      this.homelab.start();
      void this.status.refresh();
    }
  }
}
