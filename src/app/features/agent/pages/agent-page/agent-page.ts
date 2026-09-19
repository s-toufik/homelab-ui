import { Component, inject } from '@angular/core';
import { PagePanelContentDirective } from '@shell/directives/page-panel-content.directive';
import { AgentStore } from '../../application/agent.store';
import { Composer } from '../../components/composer/composer';
import { Conversation } from '../../components/conversation/conversation';
import { SettingsPanel } from '../../components/settings-panel/settings-panel';

@Component({
  selector: 'app-agent-page',
  imports: [PagePanelContentDirective, SettingsPanel, Conversation, Composer],
  providers: [AgentStore],
  templateUrl: './agent-page.html',
  styleUrl: './agent-page.scss',
})
export class AgentPage {
  protected readonly store = inject(AgentStore);
}
