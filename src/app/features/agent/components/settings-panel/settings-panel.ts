import { Component, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings-panel',
  imports: [FormsModule],
  templateUrl: './settings-panel.html',
  styleUrl: './settings-panel.scss',
})
export class SettingsPanel {
  readonly knownModels = input.required<readonly string[]>();
  readonly modelName = model.required<string>();
  readonly sessionId = model.required<string>();
  readonly autoApprove = model.required<boolean>();
  readonly newSession = output<void>();

  readonly copied = signal(false);
  private copiedTimeout?: ReturnType<typeof setTimeout>;

  async copySessionId(): Promise<void> {
    await navigator.clipboard.writeText(this.sessionId());
    this.copied.set(true);
    clearTimeout(this.copiedTimeout);
    this.copiedTimeout = setTimeout(() => this.copied.set(false), 1500);
  }
}
