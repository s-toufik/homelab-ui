import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { LayoutStore } from '@shell/application/layout.store';
import { AgentStore } from '../../application/agent.store';
import { Composer } from '../composer/composer';
import { Conversation } from '../conversation/conversation';

@Component({
  selector: 'app-assistant',
  imports: [FormsModule, RouterLink, Conversation, Composer],
  templateUrl: './assistant.html',
  styleUrl: './assistant.scss',
})
export class Assistant {
  protected readonly store = inject(AgentStore);
  protected readonly ui = inject(LayoutStore);

  constructor() {
    if (this.store.modelNames().length === 0) void this.store.loadModels();
  }
}
