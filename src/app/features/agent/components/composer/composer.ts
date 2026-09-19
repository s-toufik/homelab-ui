import { Component, ElementRef, effect, input, model, output, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-composer',
  imports: [FormsModule],
  templateUrl: './composer.html',
  styleUrl: './composer.scss',
})
export class Composer {
  readonly draft = model.required<string>();
  readonly canSend = input.required<boolean>();
  readonly isStreaming = input.required<boolean>();
  readonly send = output<void>();
  readonly cancel = output<void>();

  private readonly textarea = viewChild<ElementRef<HTMLTextAreaElement>>('textarea');

  constructor() {
    // Re-measure whenever draft changes for any reason -- typing (including
    // Shift+Enter newlines) and it being cleared programmatically on send,
    // which a plain (input) handler wouldn't catch. requestAnimationFrame
    // defers the read past Angular's DOM patch for this change, so
    // scrollHeight reflects the new content rather than the previous one.
    effect(() => {
      this.draft();
      requestAnimationFrame(() => this.autoGrow());
    });
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.send.emit();
    }
  }

  private autoGrow(): void {
    const element = this.textarea()?.nativeElement;
    if (!element) return;
    element.style.height = 'auto';
    element.style.height = `${element.scrollHeight}px`;
  }
}
