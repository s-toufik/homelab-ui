import { Injectable, InjectionToken, Provider, signal } from '@angular/core';

export const COMMAND_GROUPS = ['Ask', 'Go to', 'Conversations', 'Do'] as const;
export type CommandGroup = (typeof COMMAND_GROUPS)[number];

export interface Command {
  readonly id: string;
  readonly group: CommandGroup;
  readonly label: string;
  readonly hint?: string;
  readonly keywords?: string;
  readonly run: () => void;
}

export interface CommandSource {
  commands(query: string): readonly Command[];
}

export const COMMAND_SOURCES = new InjectionToken<readonly CommandSource[]>('COMMAND_SOURCES');

export function provideCommandSource(describe: () => CommandSource): Provider {
  return { provide: COMMAND_SOURCES, multi: true, useFactory: describe };
}

export function matches(query: string, ...texts: (string | undefined)[]): boolean {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  const haystack = texts.filter(Boolean).join(' ').toLowerCase();
  return words.every((word) => haystack.includes(word));
}

export function ranked(commands: readonly Command[], limit = 6): Command[] {
  return COMMAND_GROUPS.flatMap((group) =>
    commands.filter((command) => command.group === group).slice(0, limit),
  );
}

@Injectable({ providedIn: 'root' })
export class CommandPaletteStore {
  readonly isOpen = signal(false);
  readonly query = signal('');

  open(query = ''): void {
    this.query.set(query);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }

  toggle(): void {
    if (this.isOpen()) this.close();
    else this.open();
  }
}
