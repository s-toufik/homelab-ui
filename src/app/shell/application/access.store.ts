import { Injectable, computed, inject } from '@angular/core';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import type { HomelabFeature } from '../domain/homelab-feature';
import { HOMELAB_FEATURES } from './homelab-features';

export const ROLE_PREFIX = 'role:';

@Injectable({ providedIn: 'root' })
export class AccessStore {
  private readonly session = inject(GatewaySession);
  private readonly all = inject(HOMELAB_FEATURES, { optional: true }) ?? [];

  readonly isAdmin = this.session.isAdmin;
  readonly granted = computed(
    () =>
      new Set(
        this.session
          .groups()
          .filter((group) => group.startsWith(ROLE_PREFIX))
          .map((group) => group.slice(ROLE_PREFIX.length)),
      ),
  );

  readonly features = computed(() =>
    this.all.filter((feature) => feature.listed !== false && this.canUse(feature)),
  );

  can(access: string | undefined): boolean {
    if (this.isAdmin()) return true;
    return access === undefined || this.granted().has(access);
  }

  canUse(feature: Pick<HomelabFeature, 'access' | 'adminOnly'>): boolean {
    if (this.isAdmin()) return true;
    if (feature.adminOnly) return false;
    return this.can(feature.access);
  }

  canUseAgent(name: string): boolean {
    return this.can(agentAccess(name));
  }
}

export function agentAccess(name: string): string {
  return `agent:${name}`;
}
