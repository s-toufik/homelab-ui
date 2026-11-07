import { NgComponentOutlet } from '@angular/common';
import { Component, ElementRef, Type, effect, inject, signal } from '@angular/core';
import { SwarmAvatar } from '@shared/ui/swarm-avatar/swarm-avatar';
import { ASSISTANT_PANEL } from '../application/assistant-panel';
import { ASSISTANT_DEFAULT_WIDTH, LayoutStore } from '../application/layout.store';

const KEY_STEP = 32;

@Component({
  selector: 'app-assistant-drawer',
  imports: [NgComponentOutlet, SwarmAvatar],
  templateUrl: './assistant-drawer.html',
  styleUrl: './assistant-drawer.scss',
  host: { '(document:keydown.escape)': 'ui.closeAssistant()' },
})
export class AssistantDrawer {
  protected readonly ui = inject(LayoutStore);
  protected readonly panel = inject(ASSISTANT_PANEL);
  private readonly host = inject(ElementRef<HTMLElement>);
  protected readonly content = signal<Type<unknown> | null>(null);

  constructor() {
    effect(() => {
      if (this.ui.assistantOpen() && !this.content()) {
        void this.panel.load().then((component) => this.content.set(component));
      }
    });
  }

  protected startResize(event: PointerEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    const handle = event.currentTarget as HTMLElement;
    const drawer = (this.host.nativeElement as HTMLElement).querySelector('.assistant-drawer');
    const right = drawer?.getBoundingClientRect().right ?? globalThis.innerWidth;
    handle.setPointerCapture(event.pointerId);
    this.ui.resizing.set(true);

    const move = (moveEvent: PointerEvent) => this.ui.resizeAssistant(right - moveEvent.clientX);
    const stop = () => {
      handle.removeEventListener('pointermove', move);
      handle.removeEventListener('pointerup', stop);
      handle.removeEventListener('pointercancel', stop);
      this.ui.resizing.set(false);
      this.ui.saveAssistantWidth();
    };
    handle.addEventListener('pointermove', move);
    handle.addEventListener('pointerup', stop);
    handle.addEventListener('pointercancel', stop);
  }

  protected resizeWithKeys(event: KeyboardEvent): void {
    const step = event.key === 'ArrowLeft' ? KEY_STEP : event.key === 'ArrowRight' ? -KEY_STEP : 0;
    if (event.key === 'Home') {
      this.ui.resizeAssistant(ASSISTANT_DEFAULT_WIDTH);
    } else if (step) {
      this.ui.resizeAssistant(this.ui.assistantWidth() + step);
    } else {
      return;
    }
    event.preventDefault();
    this.ui.saveAssistantWidth();
  }

  protected resetWidth(): void {
    this.ui.resizeAssistant(ASSISTANT_DEFAULT_WIDTH);
    this.ui.saveAssistantWidth();
  }
}
