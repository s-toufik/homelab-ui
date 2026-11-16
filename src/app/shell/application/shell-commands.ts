import { Provider, inject } from '@angular/core';
import { Router } from '@angular/router';
import { THEMES } from '../domain/theme-preferences';
import { AccessStore } from './access.store';
import { AppsStore } from './apps.store';
import { matches, provideCommandSource, type Command } from './commands';
import { ThemeStore } from './theme.store';

export function provideShellCommands(): Provider {
  return provideCommandSource(() => {
    const router = inject(Router);
    const access = inject(AccessStore);
    const apps = inject(AppsStore);
    const theme = inject(ThemeStore);
    const go = (id: string, label: string, path: string, keywords = ''): Command => ({
      id: `go-${id}`,
      group: 'Go to',
      label,
      hint: 'page',
      keywords,
      run: () => void router.navigateByUrl(path),
    });
    return {
      commands(query: string): Command[] {
        const pages: Command[] = [
          go('today', 'Today', '/', 'home briefing'),
          go('assistant', 'Assistant', '/assistant', 'chat conversations'),
          go('agents', 'Agents', '/agents', 'who is working animation kitchen travel'),
          ...(access.isAdmin()
            ? [
                go('map', 'Map', '/map', 'cluster k3s topology'),
                go('people', 'People', '/people', 'access users accounts'),
              ]
            : []),
          ...apps.pages().map((page) => go(page.id, page.label, page.path, page.tagline)),
          go('account', 'Account', '/account', 'password profile sessions'),
          go('appearance', 'Appearance', '/appearance', 'theme dark light'),
        ];
        const themes: Command[] = THEMES.map((option) => ({
          id: `theme-${option.id}`,
          group: 'Do',
          label: `Use the ${option.name} theme`,
          keywords: 'theme appearance dark light',
          run: () => theme.choose(option.id),
        }));
        if (!query) return pages.slice(0, 5);
        return [...pages, ...themes].filter((command) =>
          matches(query, command.label, command.keywords),
        );
      },
    };
  });
}
