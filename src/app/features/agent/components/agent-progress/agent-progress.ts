import { NgTemplateOutlet } from '@angular/common';
import { Component, ElementRef, computed, input, signal, viewChild } from '@angular/core';
import type { AgentMood } from '../../domain/agent-activity';
import { agentLook } from '../../domain/agent-looks';
import {
  stepCount,
  visibleTools,
  type AgentRunState,
  type ProgressNode,
  type StepState,
} from '../../domain/agent-progress';
import { AgentScene } from '../agent-scene/agent-scene';

const STATE_TEXT: Readonly<Record<AgentRunState, string>> = {
  working: 'working…',
  answered: 'answered',
  needs_input: 'needs input',
  refused: 'refused',
  failed: 'failed',
  unreachable: 'unreachable',
  stopped: 'stopped',
};

const STEP_LABELS: Readonly<Record<StepState, string>> = {
  done: 'Done: ',
  current: 'Now: ',
  todo: 'Next: ',
  stopped: 'Stopped at: ',
};

const MOODS: Readonly<Record<AgentRunState, AgentMood>> = {
  working: 'working',
  answered: 'idle',
  needs_input: 'waiting',
  refused: 'trouble',
  failed: 'trouble',
  unreachable: 'trouble',
  stopped: 'idle',
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

  protected readonly STEP_LABELS = STEP_LABELS;

  private readonly choice = signal<boolean | null>(null);
  private readonly details = viewChild<ElementRef<HTMLDialogElement>>('details');
  protected readonly detailsOpen = signal(false);

  protected readonly look = computed(() => agentLook(this.node().agent ?? 'supervisor'));
  protected readonly tools = computed(() => visibleTools(this.node()));
  protected readonly steps = computed(() => (this.showPlan() ? this.node().steps : []));
  protected readonly count = computed(() => stepCount(this.node()));
  protected readonly working = computed(() => this.node().state === 'working');
  protected readonly stopped = computed(() => this.node().state === 'stopped');
  protected readonly mood = computed<AgentMood>(() => MOODS[this.node().state ?? 'answered']);
  protected readonly state = computed<AgentRunState>(() => this.node().state ?? 'answered');
  protected readonly stateText = computed(() => STATE_TEXT[this.state()]);
  protected readonly failedTools = computed(
    () => this.tools().filter((tool) => tool.state === 'failed').length,
  );
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

  protected openDetails(): void {
    const dialog = this.details()?.nativeElement;
    this.detailsOpen.set(true);
    if (dialog && !dialog.open) {
      try {
        dialog.showModal();
      } catch {
        dialog.setAttribute('open', '');
      }
    }
  }

  protected closeDetails(): void {
    const dialog = this.details()?.nativeElement;
    if (dialog?.open) {
      if (typeof dialog.close === 'function') dialog.close();
      else dialog.removeAttribute('open');
    }
    this.detailsOpen.set(false);
  }

  protected onDetailsClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) this.closeDetails();
  }
}
