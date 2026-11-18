import {
  Component,
  ElementRef,
  HostListener,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';

@Component({
  selector: 'app-screenshot-picker',
  imports: [],
  templateUrl: './screenshot-picker.html',
  styleUrl: './screenshot-picker.scss',
})
export class ScreenshotPicker {
  readonly preview = input<string | null>(null);
  readonly picked = output<{ file: Blob; name: string }>();
  readonly cleared = output<void>();

  protected readonly dragOver = signal(false);
  private readonly fileInput = viewChild<ElementRef<HTMLInputElement>>('fileInput');

  protected openPicker(): void {
    this.fileInput()?.nativeElement.click();
  }

  protected onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (file) this.picked.emit({ file, name: file.name });
    input.value = '';
  }

  @HostListener('window:paste', ['$event'])
  protected onPaste(event: ClipboardEvent): void {
    const item = Array.from(event.clipboardData?.items ?? []).find((candidate) =>
      candidate.type.startsWith('image/'),
    );
    const file = item?.getAsFile();
    if (!file) return;
    event.preventDefault();
    this.picked.emit({ file, name: 'Pasted screenshot' });
  }

  protected onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(true);
  }

  protected onDragLeave(): void {
    this.dragOver.set(false);
  }

  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    this.dragOver.set(false);
    const file = event.dataTransfer?.files[0];
    if (file?.type.startsWith('image/')) this.picked.emit({ file, name: file.name });
  }

  protected clear(): void {
    this.cleared.emit();
  }
}
