import { Injectable, inject } from '@angular/core';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import type { CenterAccount } from '@shell/application/center-account';
import { isCenterStyle, type CenterStyleId } from '@shell/domain/center-style';
import { AccountApiService } from './account-api.service';

export const CENTER_ATTRIBUTE = 'homelabCenter';

@Injectable({ providedIn: 'root' })
export class AccountCenterAdapter implements CenterAccount {
  private readonly api = inject(AccountApiService);
  private readonly session = inject(GatewaySession);

  async read(): Promise<CenterStyleId | null> {
    if (!this.session.enabled) return null;
    const value = await this.api.attribute(CENTER_ATTRIBUTE);
    return isCenterStyle(value) ? value : null;
  }

  async write(style: CenterStyleId): Promise<void> {
    if (!this.session.enabled) return;
    await this.api.saveAttribute(CENTER_ATTRIBUTE, style);
  }
}
