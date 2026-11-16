import { Component, computed, input } from '@angular/core';
import type { AgentMood } from '../../domain/agent-activity';

const SCENES = ['kitchen', 'travel', 'observation', 'analysis', 'coding', 'security'];
let nextScene = 0;

@Component({
  selector: 'app-agent-scene',
  templateUrl: './agent-scene.html',
  styleUrl: './agent-scene.scss',
})
export class AgentScene {
  readonly agent = input.required<string>();
  readonly mood = input<AgentMood>('idle');
  readonly label = input('');

  protected readonly uid = `scene-${nextScene++}`;
  protected readonly kind = computed(() =>
    SCENES.includes(this.agent()) ? this.agent() : 'conductor',
  );

  protected url(name: string): string {
    return `url(#${this.uid}-${name})`;
  }
}
