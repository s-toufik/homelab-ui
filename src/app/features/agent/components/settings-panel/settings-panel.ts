import { Component, computed, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-settings-panel',
  imports: [FormsModule],
  templateUrl: './settings-panel.html',
  styleUrl: './settings-panel.scss',
})
export class SettingsPanel {
  readonly models = input.required<readonly string[]>();
  readonly pinnedSteps = input.required<Readonly<Record<string, string>>>();
  readonly modelsError = input<string | null>(null);
  readonly modelName = model.required<string>();
  readonly sessionId = model.required<string>();
  readonly autoApprove = model.required<boolean>();
  readonly newSession = output<void>();

  readonly pinnedNote = computed(() => {
    const pinned = Object.entries(this.pinnedSteps());
    if (pinned.length === 0) return null;
    const models = new Set(pinned.map(([, name]) => name));
    if (models.size === 1) {
      const steps = pinned.map(([step]) => step).join(', ');
      return `The server fixes ${[...models][0]} for: ${steps}.`;
    }
    return `The server fixes ${pinned.map(([step, name]) => `${step} → ${name}`).join(', ')}.`;
  });

  readonly copied = signal(false);
  private copiedTimeout?: ReturnType<typeof setTimeout>;

  async copySessionId(): Promise<void> {
    await navigator.clipboard.writeText(this.sessionId());
    this.copied.set(true);
    clearTimeout(this.copiedTimeout);
    this.copiedTimeout = setTimeout(() => this.copied.set(false), 1500);
  }
}
