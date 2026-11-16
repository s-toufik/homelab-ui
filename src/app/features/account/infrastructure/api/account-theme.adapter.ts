import { Injectable, inject } from '@angular/core';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import type { ThemeAccount } from '@shell/application/theme-account';
import { isThemeChoice, type ThemeChoice } from '@shell/domain/theme-preferences';
import { AccountApiService } from './account-api.service';

export const THEME_ATTRIBUTE = 'homelabTheme';

@Injectable({ providedIn: 'root' })
export class AccountThemeAdapter implements ThemeAccount {
  private readonly api = inject(AccountApiService);
  private readonly session = inject(GatewaySession);

  async read(): Promise<ThemeChoice | null> {
    if (!this.session.enabled) return null;
    const value = await this.api.attribute(THEME_ATTRIBUTE);
    return isThemeChoice(value) ? value : null;
  }

  async write(choice: ThemeChoice): Promise<void> {
    if (!this.session.enabled) return;
    await this.api.saveAttribute(THEME_ATTRIBUTE, choice);
  }
}
