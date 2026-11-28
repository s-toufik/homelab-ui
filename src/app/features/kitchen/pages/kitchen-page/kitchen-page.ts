import { DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { PageChromeStore } from '@shell/application/page-chrome.store';
import { ScrollLockDirective } from '@shared/ui/scroll-lock/scroll-lock.directive';
import { RecipeEditorStore } from '../../application/recipe-editor.store';
import { KitchenToastStore } from '../../application/kitchen-toast.store';
import { IngredientList } from '../../components/ingredient-list/ingredient-list';
import { MethodSteps } from '../../components/method-steps/method-steps';
import { NutritionPanel } from '../../components/nutrition-panel/nutrition-panel';
import { RecipeOverview } from '../../components/recipe-overview/recipe-overview';
import { RecipePicker } from '../../components/recipe-picker/recipe-picker';
import { TastingNotes } from '../../components/tasting-notes/tasting-notes';
import { VersionHistory } from '../../components/version-history/version-history';
import { activeSection } from '../../domain/section-spy';

/** Below this width the actions leave the header for a bar at the bottom of the screen. */
const PHONE_QUERY = '(max-width: 767px)';

/** How long scrolling must pause before a jump from a tab counts as finished. */
const JUMP_SETTLE_MS = 150;
/** Room left between the sticky header and a section the tabs jump to. */
const SECTION_GAP_PX = 12;

const SECTIONS = [
  { id: 'sec-overview', label: 'Overview' },
  { id: 'sec-ingredients', label: 'Ingredients' },
  { id: 'sec-method', label: 'Method' },
  { id: 'sec-nutrition', label: 'Macros' },
] as const;

@Component({
  selector: 'app-kitchen-page',
  imports: [
    DecimalPipe,
    RouterLink,
    ScrollLockDirective,
    RecipePicker,
    VersionHistory,
    RecipeOverview,
    IngredientList,
    NutritionPanel,
    MethodSteps,
    TastingNotes,
  ],
  templateUrl: './kitchen-page.html',
  styleUrls: ['./kitchen-page.scss', '../../kitchen-theme.scss'],
  host: {
    '[style.--kitchen-dock-height.px]': 'dockHeight() || null',
    '[style.--kitchen-scroll-offset.px]': 'scrollOffset()',
    '(document:keydown.escape)': 'closeActions()',
  },
})
export class KitchenPage implements AfterViewInit {
  protected readonly store = inject(RecipeEditorStore);
  protected readonly toast = inject(KitchenToastStore);
  private readonly chrome = inject(PageChromeStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  protected readonly sections = SECTIONS;
  protected readonly activeSection = signal<string>(SECTIONS[0].id);
  /** Height of the actions bar while it is pinned to the bottom of a phone screen, else 0. */
  protected readonly dockHeight = signal(0);
  /** Where a section's top lands after a jump: just under the sticky header(s), in px from the top. */
  protected readonly scrollOffset = signal(128);
  /** The ⋯ menu: open a recipe, browse, copy, start a new one. A sheet on a phone, a popover elsewhere. */
  protected readonly actionsOpen = signal(false);
  /** Where the popover hangs from the ⋯ button, in px from the top and right of the window. */
  protected readonly menuAnchor = signal({ top: 0, right: 0 });

  private readonly header = viewChild<ElementRef<HTMLElement>>('header');
  private readonly actions = viewChild<ElementRef<HTMLElement>>('actions');
  private readonly sheet = viewChild<ElementRef<HTMLElement>>('sheet');
  /** The section a tab jumped to; the scroll tracker leaves the tabs alone until the jump settles. */
  private jumpingTo: string | null = null;
  private settleTimer: ReturnType<typeof setTimeout> | undefined;
  private readonly query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  constructor() {
    const recipeId = this.query().get('recipe');
    if (recipeId) void this.store.load(recipeId);

    effect(() => this.sheet()?.nativeElement.focus());
    this.destroyRef.onDestroy(() => this.chrome.bottomInset.set(0));
  }

  ngAfterViewInit(): void {
    const actions = this.actions()?.nativeElement;
    const header = this.header()?.nativeElement;
    const phone = globalThis.matchMedia?.(PHONE_QUERY);
    const measure = () => {
      const height = actions && phone?.matches ? actions.getBoundingClientRect().height : 0;
      this.dockHeight.set(height);
      this.chrome.bottomInset.set(height);
      if (header) {
        // The header sticks below the phone's top bar, so its own `top` is part of the offset.
        const stuckAt = parseFloat(getComputedStyle(header).top) || 0;
        this.scrollOffset.set(Math.round(stuckAt + header.offsetHeight + SECTION_GAP_PX));
      }
    };
    const observer = new ResizeObserver(measure);
    if (actions) observer.observe(actions);
    if (header) observer.observe(header);
    phone?.addEventListener('change', measure);

    let frame = 0;
    const onScroll = () => {
      if (this.jumpingTo) {
        this.settleJumpSoon();
        return;
      }
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => this.spySection());
    };
    const host = this.host.nativeElement;
    host.addEventListener('scroll', onScroll, { passive: true });
    globalThis.addEventListener('scroll', onScroll, { passive: true });
    this.destroyRef.onDestroy(() => {
      observer.disconnect();
      phone?.removeEventListener('change', measure);
      cancelAnimationFrame(frame);
      clearTimeout(this.settleTimer);
      host.removeEventListener('scroll', onScroll);
      globalThis.removeEventListener('scroll', onScroll);
    });
  }

  protected scrollTo(id: string): void {
    this.activeSection.set(id);
    // A section near the end may not reach the top, so the tab you tapped stays lit
    // until the smooth scroll has stopped, instead of following the page back.
    this.jumpingTo = id;
    this.settleJumpSoon(4 * JUMP_SETTLE_MS);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  private settleJumpSoon(delay = JUMP_SETTLE_MS): void {
    clearTimeout(this.settleTimer);
    this.settleTimer = setTimeout(() => (this.jumpingTo = null), delay);
  }

  protected openActions(event: MouseEvent): void {
    const button = (event.currentTarget as HTMLElement).getBoundingClientRect();
    this.menuAnchor.set({ top: button.bottom + 8, right: globalThis.innerWidth - button.right });
    this.actionsOpen.set(true);
  }

  protected closeActions(): void {
    this.actionsOpen.set(false);
  }

  protected async copySheet(): Promise<void> {
    this.closeActions();
    const draft = this.store.displayedDraft();
    const perPortion = this.store.displayedNutritionPerPortion();
    const lines = [
      `${(draft.title || 'Untitled recipe').toUpperCase()} (${draft.course})`,
      `Portions: ${draft.portions} | Prep: ${draft.prepTimeMinutes}m | Cook: ${draft.cookTimeMinutes}m`,
      `Per portion: ${Math.round(perPortion.kcal)} kcal (P: ${perPortion.proteinG.toFixed(1)}g | C: ${perPortion.carbG.toFixed(1)}g | F: ${perPortion.fatG.toFixed(1)}g)`,
      '',
      'INGREDIENTS:',
      ...draft.ingredients.map((line) => `• ${line.quantity}${line.unit} ${line.name}`),
      '',
      'METHOD:',
      ...draft.steps.map(
        (step, index) =>
          `${index + 1}. ${step.text}${step.tags.length ? ` [${step.tags.join(', ')}]` : ''}`,
      ),
      '',
      `NOTES: ${draft.notes || 'None'}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      this.toast.show('Copied recipe sheet to clipboard');
    } catch {
      this.toast.show('Copy was blocked by the browser');
    }
  }

  protected startNew(): void {
    this.closeActions();
    this.store.newRecipe();
    this.toast.show('New blank recipe ready');
  }

  private spySection(): void {
    const positions = SECTIONS.flatMap(({ id }) => {
      const element = document.getElementById(id);
      return element ? [{ id, top: element.getBoundingClientRect().top }] : [];
    });
    // A section counts as reached once its top is where a jump from its tab would put it.
    const id = activeSection(positions, this.scrollOffset() + 4, this.atEnd());
    if (id) this.activeSection.set(id);
  }

  /** On a phone the whole document scrolls; on wider screens the page scrolls inside itself. */
  private atEnd(): boolean {
    const host = this.host.nativeElement;
    if (host.scrollHeight > host.clientHeight + 1) {
      return host.scrollTop + host.clientHeight >= host.scrollHeight - 2;
    }
    const root = document.documentElement;
    return globalThis.innerHeight + globalThis.scrollY >= root.scrollHeight - 2;
  }
}
