import { DecimalPipe } from '@angular/common';
import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { RecipeEditorStore } from '../../application/recipe-editor.store';
import { KitchenToastStore } from '../../application/kitchen-toast.store';
import { IngredientList } from '../../components/ingredient-list/ingredient-list';
import { MethodSteps } from '../../components/method-steps/method-steps';
import { NutritionPanel } from '../../components/nutrition-panel/nutrition-panel';
import { RecipeOverview } from '../../components/recipe-overview/recipe-overview';
import { RecipePicker } from '../../components/recipe-picker/recipe-picker';
import { TastingNotes } from '../../components/tasting-notes/tasting-notes';
import { VersionHistory } from '../../components/version-history/version-history';

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
})
export class KitchenPage implements AfterViewInit {
  protected readonly store = inject(RecipeEditorStore);
  protected readonly toast = inject(KitchenToastStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly route = inject(ActivatedRoute);

  protected readonly sections = SECTIONS;
  protected readonly activeSection = signal<string>(SECTIONS[0].id);
  protected readonly headerHeight = signal(72);

  private readonly header = viewChild<ElementRef<HTMLElement>>('header');
  private readonly query = toSignal(this.route.queryParamMap, {
    initialValue: this.route.snapshot.queryParamMap,
  });

  constructor() {
    const recipeId = this.query().get('recipe');
    if (recipeId) void this.store.load(recipeId);
  }

  ngAfterViewInit(): void {
    const element = this.header()?.nativeElement;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry) this.headerHeight.set(entry.target.getBoundingClientRect().height);
    });
    observer.observe(element);
    this.destroyRef.onDestroy(() => observer.disconnect());
  }

  protected scrollTo(id: string): void {
    this.activeSection.set(id);
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  protected async copySheet(): Promise<void> {
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
    this.store.newRecipe();
    this.toast.show('New blank recipe ready');
  }
}
