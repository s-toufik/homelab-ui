import {
  Component,
  ElementRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  COMMAND_GROUPS,
  COMMAND_SOURCES,
  CommandPaletteStore,
  ranked,
  type Command,
} from '../application/commands';

@Component({
  selector: 'app-command-palette',
  imports: [FormsModule],
  templateUrl: './command-palette.html',
  styleUrl: './command-palette.scss',
})
export class CommandPalette {
  protected readonly store = inject(CommandPaletteStore);
  private readonly sources = inject(COMMAND_SOURCES, { optional: true }) ?? [];
  private readonly input = viewChild<ElementRef<HTMLInputElement>>('input');
  protected readonly active = signal(0);

  protected readonly results = computed(() =>
    ranked(this.sources.flatMap((source) => source.commands(this.store.query().trim()))),
  );
  protected readonly groups = computed(() =>
    COMMAND_GROUPS.map((group) => ({
      group,
      items: this.results().filter((command) => command.group === group),
    })).filter((entry) => entry.items.length > 0),
  );

  constructor() {
    effect(() => {
      if (this.store.isOpen()) requestAnimationFrame(() => this.input()?.nativeElement.focus());
    });
    effect(() => {
      this.store.query();
      this.active.set(0);
    });
  }

  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    const typing = !!target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName);
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
      event.preventDefault();
      this.store.toggle();
    } else if (event.key === '/' && !typing && !this.store.isOpen()) {
      event.preventDefault();
      this.store.open();
    } else if (this.store.isOpen() && event.key === 'Escape') {
      this.store.close();
    }
  }

  protected onInputKey(event: KeyboardEvent): void {
    const count = this.results().length;
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      this.active.set(count ? (this.active() + 1) % count : 0);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      this.active.set(count ? (this.active() - 1 + count) % count : 0);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const command = this.results()[this.active()];
      if (command) this.run(command);
    }
  }

  protected index(command: Command): number {
    return this.results().indexOf(command);
  }

  protected run(command: Command): void {
    this.store.close();
    command.run();
  }
}
