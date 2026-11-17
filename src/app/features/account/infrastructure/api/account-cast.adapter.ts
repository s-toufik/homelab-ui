import { Injectable, inject } from '@angular/core';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import type { CastAccount } from '@shell/application/cast-account';
import { isCastChoice, type CastChoice } from '@shell/domain/agent-cast';
import { AccountApiService } from './account-api.service';

export const CAST_ATTRIBUTE = 'homelabCast';

@Injectable({ providedIn: 'root' })
export class AccountCastAdapter implements CastAccount {
  private readonly api = inject(AccountApiService);
  private readonly session = inject(GatewaySession);

  async read(): Promise<CastChoice | null> {
    if (!this.session.enabled) return null;
    const value = await this.api.attribute(CAST_ATTRIBUTE);
    return isCastChoice(value) ? value : null;
  }

  async write(choice: CastChoice): Promise<void> {
    if (!this.session.enabled) return;
    await this.api.saveAttribute(CAST_ATTRIBUTE, choice);
  }
}
