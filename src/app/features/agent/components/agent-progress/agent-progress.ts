import { NgTemplateOutlet } from '@angular/common';
import { Component, computed, input, signal } from '@angular/core';
import type { AgentMood } from '../../domain/agent-activity';
import { agentLook } from '../../domain/agent-looks';
import {
  stepCount,
  visibleTools,
  type AgentRunState,
  type ProgressNode,
} from '../../domain/agent-progress';
import { AgentScene } from '../agent-scene/agent-scene';

const STATE_TEXT: Readonly<Record<AgentRunState, string>> = {
  working: 'working…',
  answered: 'answered',
  needs_input: 'needs input',
  refused: 'refused',
  failed: 'failed',
  unreachable: 'unreachable',
};

const MOODS: Readonly<Record<AgentRunState, AgentMood>> = {
  working: 'working',
  answered: 'idle',
  needs_input: 'waiting',
  refused: 'trouble',
  failed: 'trouble',
  unreachable: 'trouble',
};

@Component({
  selector: 'app-agent-progress',
  imports: [NgTemplateOutlet, AgentScene],
  templateUrl: './agent-progress.html',
  styleUrl: './agent-progress.scss',
})
export class AgentProgress {
  readonly node = input.required<ProgressNode>();
  readonly streaming = input(false);
  readonly showPlan = input(true);

  private readonly choice = signal<boolean | null>(null);

  protected readonly look = computed(() => agentLook(this.node().agent ?? 'supervisor'));
  protected readonly tools = computed(() => visibleTools(this.node()));
  protected readonly steps = computed(() => (this.showPlan() ? this.node().steps : []));
  protected readonly count = computed(() => stepCount(this.node()));
  protected readonly working = computed(() => this.node().state === 'working');
  protected readonly mood = computed<AgentMood>(() => MOODS[this.node().state ?? 'answered']);
  protected readonly stateText = computed(() => STATE_TEXT[this.node().state ?? 'answered']);
  protected readonly open = computed(() => this.choice() ?? this.working());
  protected readonly ownOpen = computed(() => this.choice() ?? this.streaming());
  protected readonly hasWork = computed(() => this.steps().length > 0 || this.tools().length > 0);

  protected readonly summary = computed(() => {
    const parts: string[] = [];
    const { done, total } = this.count();
    if (total && this.showPlan()) parts.push(`${done} of ${total} steps`);
    const tools = this.tools().length;
    if (tools) parts.push(`${tools} tool call${tools === 1 ? '' : 's'}`);
    const agents = this.node().agents.length;
    if (agents) parts.push(`${agents} agent${agents === 1 ? '' : 's'}`);
    return parts.join(' · ');
  });

  protected toggle(): void {
    this.choice.set(!this.open());
  }

  protected toggleOwn(): void {
    this.choice.set(!this.ownOpen());
  }
}
