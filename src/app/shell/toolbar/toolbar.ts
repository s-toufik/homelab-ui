import { Component, inject } from '@angular/core';
import { CommandPaletteStore } from '../application/commands';
import { SHELL_ICONS } from '../domain/navigation';
import { FeatureIcon } from '../feature-icon/feature-icon';

@Component({
  selector: 'app-toolbar',
  imports: [FeatureIcon],
  template: `
    <div class="toolbar">
      <button type="button" class="toolbar__search" (click)="palette.open()">
        <app-feature-icon [paths]="icons.search" [size]="15" />
        <span>Search or ask anything</span>
        <kbd>⌘K</kbd>
      </button>
      <div class="toolbar__end"><ng-content /></div>
    </div>
  `,
  styles: `
    :host {
      display: block;
      flex-shrink: 0;
    }
    .toolbar {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      height: calc(3.4rem + var(--safe-top));
      padding: var(--safe-top) 1rem 0;
      border-bottom: var(--border-width) solid var(--border);
    }
    .toolbar__search {
      flex: 0 1 29rem;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 0.55rem;
      height: 2.15rem;
      padding: 0 0.5rem 0 0.7rem;
      border: var(--border-width) solid var(--border);
      border-radius: 0.55rem;
      background: var(--surface-raised);
      color: var(--text-muted);
      font: inherit;
      font-size: 0.85rem;
      cursor: text;
    }
    .toolbar__search span {
      flex: 1;
      text-align: left;
    }
    kbd {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      padding: 0.05rem 0.4rem;
      border: var(--border-width) solid var(--border);
      border-radius: 0.3rem;
      background: var(--surface);
    }
    .toolbar__end {
      position: absolute;
      right: calc(1rem + var(--safe-right));
      top: calc(0.55rem + var(--safe-top));
      display: flex;
      gap: 0.4rem;
    }
    @media (max-width: 767px) {
      .toolbar__search {
        margin: 0 5.5rem 0 0;
      }
      kbd {
        display: none;
      }
    }
  `,
})
export class Toolbar {
  protected readonly palette = inject(CommandPaletteStore);
  protected readonly icons = SHELL_ICONS;
}
