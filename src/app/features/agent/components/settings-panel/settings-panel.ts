import { Component, input, model, output } from '@angular/core';
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
  readonly newSession = output<void>();
}
