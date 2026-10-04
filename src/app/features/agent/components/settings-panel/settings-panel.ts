import { Component, computed, input, model, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';

const STEP_LABELS: Readonly<Record<string, string>> = {
  understand: 'Understand',
  plan: 'Plan',
  act: 'Answer',
  review: 'Review',
  summarize: 'Summarize',
};

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

  readonly pinned = computed(() =>
    Object.entries(this.pinnedSteps()).map(([step, model]) => ({
      step: STEP_LABELS[step] ?? step,
      model,
      shortName: model.split('/').pop() ?? model,
    })),
  );

  readonly copied = signal(false);
  private copiedTimeout?: ReturnType<typeof setTimeout>;

  async copySessionId(): Promise<void> {
    await navigator.clipboard.writeText(this.sessionId());
    this.copied.set(true);
    clearTimeout(this.copiedTimeout);
    this.copiedTimeout = setTimeout(() => this.copied.set(false), 1500);
  }
}
