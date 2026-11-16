import { Component, computed, inject } from '@angular/core';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { ThemeStore } from '../application/theme.store';
import {
  DAY_THEME,
  NIGHT_THEME,
  THEMES,
  themeOption,
  type ThemeId,
} from '../domain/theme-preferences';

@Component({
  selector: 'app-appearance',
  templateUrl: './appearance.html',
  styleUrl: './appearance.scss',
})
export class Appearance {
  protected readonly theme = inject(ThemeStore);
  private readonly session = inject(GatewaySession);
  protected readonly groups = [
    { title: 'Everyday', themes: THEMES.filter((option) => !option.storybook) },
    { title: 'Storybook', themes: THEMES.filter((option) => option.storybook) },
  ];
  protected readonly auto = computed(() => this.theme.choice() === 'auto');
  protected readonly activeName = computed(() => themeOption(this.theme.active()).name);
  protected readonly name = computed(() => {
    const username = this.session.user()?.username ?? '';
    return username ? username.charAt(0).toUpperCase() + username.slice(1) : 'there';
  });
  protected readonly dayName = themeOption(DAY_THEME).name;
  protected readonly nightName = themeOption(NIGHT_THEME).name;

  protected tagline(id: ThemeId, fallback: string): string {
    if (!this.auto()) return fallback;
    if (id === DAY_THEME) return 'By day';
    if (id === NIGHT_THEME) return 'At night';
    return fallback;
  }

  protected toggleAuto(): void {
    this.theme.choose(this.auto() ? this.theme.active() : 'auto');
  }
}
