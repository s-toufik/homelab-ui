import { Component, ElementRef, inject, input } from '@angular/core';
import { PaneState } from './pane-state';

@Component({
  selector: 'app-side-pane',
  host: {
    '[class]': "'side-pane side-pane--' + side()",
    '[class.side-pane--pinned]': 'state().pinned()',
    '[class.side-pane--peek]': 'state().peeking()',
    '[class.side-pane--resizing]': 'state().resizing()',
    '[style.--pane-width.px]': 'state().width()',
  },
  template: `
    @if (state().pinned()) {
      <div class="side-pane__backdrop" (click)="state().setPinned(false)"></div>
    } @else if (edge()) {
      <div
        class="side-pane__edge"
        aria-hidden="true"
        (mouseenter)="state().hover(true)"
        (mouseleave)="state().hover(false)"
      ></div>
    }
    <div
      class="side-pane__body"
      role="complementary"
      [attr.aria-label]="label()"
      [attr.aria-hidden]="!state().open()"
      [attr.inert]="state().open() ? null : ''"
      (mouseenter)="state().hover(true)"
      (mouseleave)="state().hover(false)"
      (focusin)="state().hover(true)"
    >
      <ng-content />
      <div
        class="side-pane__grip"
        role="separator"
        aria-orientation="vertical"
        [attr.aria-label]="'Resize ' + label()"
        [attr.aria-valuenow]="state().width()"
        [attr.aria-valuemin]="state().min"
        [attr.aria-valuemax]="state().max"
        tabindex="0"
        title="Drag to resize, double-click to reset"
        (pointerdown)="startResize($event)"
        (dblclick)="state().resetWidth()"
        (keydown)="nudge($event)"
      ></div>
    </div>
  `,
  styleUrl: './side-pane.scss',
})
export class SidePane {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly state = input.required<PaneState>();
  readonly side = input<'left' | 'right'>('left');
  readonly label = input('Side panel');
  readonly edge = input(true);

  protected startResize(event: PointerEvent): void {
    if (event.button !== 0) return;
    event.preventDefault();
    const grip = event.target as HTMLElement;
    const state = this.state();
    const rect = this.host.nativeElement.getBoundingClientRect();
    const left = this.side() === 'left';
    const edge = left ? rect.left : rect.right;
    grip.setPointerCapture?.(event.pointerId);
    state.resizing.set(true);

    const move = (e: PointerEvent): void =>
      state.resize(left ? e.clientX - edge : edge - e.clientX);
    const stop = (): void => {
      state.resizing.set(false);
      state.saveWidth();
      grip.removeEventListener('pointermove', move);
      grip.removeEventListener('pointerup', stop);
      grip.removeEventListener('pointercancel', stop);
    };
    grip.addEventListener('pointermove', move);
    grip.addEventListener('pointerup', stop);
    grip.addEventListener('pointercancel', stop);
  }

  protected nudge(event: KeyboardEvent): void {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    const grow = (event.key === 'ArrowRight') === (this.side() === 'left');
    const state = this.state();
    state.resize(state.width() + (grow ? 16 : -16));
    state.saveWidth();
  }
}
