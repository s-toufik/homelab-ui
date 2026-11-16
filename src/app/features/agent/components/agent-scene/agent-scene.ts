import { Component, computed, input } from '@angular/core';
import type { AgentMood } from '../../domain/agent-activity';

const SCENES = ['kitchen', 'travel', 'observation', 'analysis', 'coding', 'security'];

@Component({
  selector: 'app-agent-scene',
  templateUrl: './agent-scene.html',
  styleUrl: './agent-scene.scss',
})
export class AgentScene {
  readonly agent = input.required<string>();
  readonly mood = input<AgentMood>('idle');
  readonly label = input('');

  protected readonly kind = computed(() =>
    SCENES.includes(this.agent()) ? this.agent() : 'conductor',
  );
}
