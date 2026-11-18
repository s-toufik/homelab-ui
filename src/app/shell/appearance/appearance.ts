import { Component, computed, inject, signal } from '@angular/core';
import { AgentScene } from '@features/agent/components/agent-scene/agent-scene';
import { agentLook } from '@features/agent/domain/agent-looks';
import { SpriteSheets } from '@features/agent/infrastructure/sprites/sprite-sheets';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { CastStore } from '../application/cast.store';
import { ThemeStore } from '../application/theme.store';
import { CASTS, castForTheme, castOption } from '../domain/agent-cast';
import {
  DAY_THEME,
  NIGHT_THEME,
  THEMES,
  themeOption,
  type ThemeId,
} from '../domain/theme-preferences';

@Component({
  selector: 'app-appearance',
  imports: [AgentScene],
  templateUrl: './appearance.html',
  styleUrl: './appearance.scss',
})
export class Appearance {
  protected readonly theme = inject(ThemeStore);
  protected readonly cast = inject(CastStore);
  protected readonly casts = CASTS;
  protected readonly actors = [
    'supervisor',
    'kitchen',
    'travel',
    'observation',
    'analysis',
    'coding',
    'security',
  ].map((name) => ({ name, label: agentLook(name).label }));
  protected readonly hasSprites = signal(false);
  protected readonly themeCast = computed(() => castForTheme(this.theme.active()));
  protected readonly themeCastName = computed(() => castOption(this.themeCast()).name);
  protected readonly activeCastName = computed(() => castOption(this.cast.active()).name);
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

  constructor() {
    const sprites = inject(SpriteSheets);
    void Promise.all(this.actors.map((actor) => sprites.load(actor.name))).then((sheets) =>
      this.hasSprites.set(sheets.some((sheet) => sheet !== null)),
    );
  }

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
