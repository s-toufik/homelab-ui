import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { streamName } from '@shared/domain/log-line';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { formatBytes, formatValue } from '@shared/ui/charts/chart-format';
import { Gauge } from '@shared/ui/charts/gauge';
import { Sparkline } from '@shared/ui/charts/sparkline';
import { FeatureStatusStore } from '@shell/application/feature-status.store';
import { HOMELAB_FEATURES } from '@shell/application/homelab-features';
import { ResourceStatusStore } from '@shell/application/resource-status.store';
import { FEATURE_CATEGORIES } from '@shell/domain/homelab-feature';
import { FeatureIcon } from '@shell/feature-icon/feature-icon';
import { ControlCenterStore } from '../../application/control-center.store';

function greeting(hour: number): string {
  if (hour < 5) return 'Welcome to Blue platform !';
  if (hour < 12) return 'Good morning! Welcome to Blue platform !';
  if (hour < 18) return 'Good afternoon! Welcome to Blue platform !';
  return 'Good evening! Welcome to Blue platform !';
}

@Component({
  selector: 'app-control-center-page',
  imports: [RouterLink, DatePipe, DecimalPipe, Gauge, Sparkline, FeatureIcon],
  templateUrl: './control-center-page.html',
  styleUrl: './control-center-page.scss',
})
export class ControlCenterPage {
  protected readonly store = inject(ControlCenterStore);
  protected readonly session = inject(GatewaySession);
  protected readonly featureStatus = inject(FeatureStatusStore);
  protected readonly resources = inject(ResourceStatusStore);
  private readonly features = inject(HOMELAB_FEATURES, { optional: true }) ?? [];

  protected readonly greeting = greeting(new Date().getHours());
  protected readonly bytes = formatBytes;
  protected readonly format = formatValue;
  protected readonly streamName = streamName;

  protected readonly apps = computed(() =>
    [...this.features]
      .filter((feature) => !feature.adminOnly || this.session.isAdmin())
      .sort(
        (a, b) => FEATURE_CATEGORIES.indexOf(a.category) - FEATURE_CATEGORIES.indexOf(b.category),
      ),
  );
  protected readonly maxMemory = computed(() =>
    Math.max(1, ...this.store.topMemory().map((s) => s.value)),
  );
  protected readonly maxCpu = computed(() =>
    Math.max(0.01, ...this.store.topCpu().map((s) => s.value)),
  );

  constructor() {
    this.store.start();
    void this.featureStatus.refresh();
    void this.resources.refresh();
  }

  protected uptime(seconds: number | null | undefined): string {
    if (!seconds) return '–';
    const days = Math.floor(seconds / 86_400);
    const hours = Math.floor((seconds % 86_400) / 3600);
    return days ? `${days} d ${hours} h` : `${hours} h`;
  }

  protected up(value: number | null | undefined): 'ok' | 'bad' | 'muted' {
    if (value === null || value === undefined) return 'muted';
    return value >= 1 ? 'ok' : 'bad';
  }
}
