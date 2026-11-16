import {
  Component,
  DestroyRef,
  HostListener,
  computed,
  effect,
  inject,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { PaneState } from '@shared/ui/side-pane/pane-state';
import { SidePane } from '@shared/ui/side-pane/side-pane';
import { ActivatedRoute, Router } from '@angular/router';
import { AccessStore } from '@shell/application/access.store';
import { LayoutStore } from '@shell/application/layout.store';
import { PageChromeStore } from '@shell/application/page-chrome.store';
import { PagePanelContentDirective } from '@shell/directives/page-panel-content.directive';
import { AgentStore } from '../../application/agent.store';
import { Composer } from '../../components/composer/composer';
import { Conversation } from '../../components/conversation/conversation';
import { SettingsPanel } from '../../components/settings-panel/settings-panel';
import { isWaiting, type Conversation as ConversationEntry } from '../../domain/agent-conversation';
import { agentLook } from '../../domain/agent-looks';
import { AGENT_ORDER } from '../../agent.feature';

const DAY = 86_400_000;

function when(at: number, now = Date.now()): string {
  if (!at) return '';
  const date = new Date(at);
  if (now - at < DAY && date.getDate() === new Date(now).getDate()) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (now - at < 7 * DAY) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

@Component({
  selector: 'app-assistant-page',
  imports: [
    NgTemplateOutlet,
    PagePanelContentDirective,
    SettingsPanel,
    Conversation,
    Composer,
    SidePane,
  ],
  templateUrl: './assistant-page.html',
  styleUrl: './assistant-page.scss',
})
export class AssistantPage {
  protected readonly store = inject(AgentStore);
  protected readonly access = inject(AccessStore);
  private readonly layout = inject(LayoutStore);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly composer = viewChild(Composer);
  private readonly params = toSignal(this.route.paramMap, {
    initialValue: this.route.snapshot.paramMap,
  });
  private readonly query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  protected readonly history = new PaneState({
    key: 'homelab-ui.assistant.history',
    width: 296,
    min: 220,
    max: 480,
    pinned: true,
  });
  protected readonly changing = signal(false);
  protected readonly picking = signal(false);
  protected readonly confirming = signal<string | null>(null);
  protected readonly look = agentLook;
  protected readonly when = when;
  protected readonly isWaiting = isWaiting;
  protected readonly routeId = computed(() => this.params().get('id'));

  protected readonly agents = computed(() => {
    const known = this.store.agents().map((agent) => agent.name);
    return [
      ...AGENT_ORDER.filter((name) => known.includes(name)),
      ...known.filter((name) => !AGENT_ORDER.includes(name)),
    ].filter((name) => this.access.canUseAgent(name));
  });

  protected readonly groups = computed(() => {
    const now = Date.now();
    const visible = this.store.conversations().filter((c) => this.access.canUseAgent(c.agent));
    const today = visible.filter((c) => now - c.updatedAt < DAY);
    const week = visible.filter((c) => now - c.updatedAt >= DAY && now - c.updatedAt < 7 * DAY);
    const older = visible.filter((c) => now - c.updatedAt >= 7 * DAY);
    return [
      { title: 'Today', items: today },
      { title: 'This week', items: week },
      { title: 'Earlier', items: older },
    ].filter((group) => group.items.length);
  });

  protected readonly empty = computed(() => this.store.messages().length === 0);

  constructor() {
    const chrome = inject(PageChromeStore);
    const openPicker = (): void => this.picking.set(true);
    effect(() => {
      const empty = this.empty();
      const title = empty
        ? this.look(this.store.agentName()).label
        : (this.store.conversation()?.title ?? 'New conversation');
      untracked(() => {
        chrome.title.set(title);
        chrome.titleMenu.set(empty || this.access.isAdmin() ? openPicker : null);
      });
    });
    inject(DestroyRef).onDestroy(() => {
      chrome.title.set(null);
      chrome.titleMenu.set(null);
    });
    void this.store.loadDirectory();
    effect(() => {
      const id = this.routeId();
      const agent = this.query().get('agent');
      untracked(() => {
        if (id === 'new' || (!id && agent)) {
          this.startNew(agent ?? this.store.agentName());
        } else if (id && id !== this.store.sessionId()) {
          void this.store.openConversation(id);
        } else if (!id) {
          void this.store.loadModels();
        }
      });
    });
    effect(() => {
      const conversation = this.store.conversation();
      const id = this.routeId();
      if (conversation && id === 'new') {
        untracked(
          () => void this.router.navigate(['/assistant', conversation.id], { replaceUrl: true }),
        );
      }
    });
    effect(() => {
      if (!this.store.plan()) this.changing.set(false);
    });
  }

  protected title(): string {
    return this.store.conversation()?.title ?? 'New conversation';
  }

  protected startNew(agent: string): void {
    const allowed = this.agents();
    const chosen = this.access.canUseAgent(agent) ? agent : (allowed[0] ?? agent);
    if (this.store.messages().length || chosen !== this.store.agentName()) {
      this.store.newConversation(chosen);
    }
    void this.store.loadModels();
    this.picking.set(false);
  }

  protected newConversation(): void {
    void this.router.navigate(['/assistant', 'new']);
  }

  protected pickAgent(agent: string): void {
    this.picking.set(false);
    void this.store.chooseAgent(agent);
  }

  protected open(conversation: ConversationEntry): void {
    void this.router.navigate(['/assistant', conversation.id]);
  }

  protected readonly visibleCount = computed(
    () => this.store.conversations().filter((c) => this.access.canUseAgent(c.agent)).length,
  );

  @HostListener('document:keydown', ['$event'])
  protected onKey(event: KeyboardEvent): void {
    const target = event.target as HTMLElement | null;
    if (target && (/^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable))
      return;
    if (event.key === 'n' && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      this.newConversation();
    }
  }

  protected openSettings(): void {
    this.picking.set(false);
    this.layout.togglePanel();
  }

  protected remove(conversation: ConversationEntry): void {
    if (this.confirming() !== conversation.id) {
      this.confirming.set(conversation.id);
      return;
    }
    this.confirming.set(null);
    const open = conversation.id === this.store.sessionId();
    this.store.deleteConversation(conversation.id);
    if (open || this.routeId() === conversation.id) void this.router.navigate(['/assistant']);
  }

  protected removeAll(): void {
    if (this.confirming() !== 'all') {
      this.confirming.set('all');
      return;
    }
    this.confirming.set(null);
    this.store.deleteAll((agent) => this.access.canUseAgent(agent));
    void this.router.navigate(['/assistant']);
  }

  protected changePlan(): void {
    this.changing.set(true);
    requestAnimationFrame(() => this.composer()?.focus());
  }

  protected ask(text: string): void {
    this.store.draft.set(text);
    void this.store.send();
  }
}
