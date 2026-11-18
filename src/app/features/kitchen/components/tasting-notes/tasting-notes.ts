import { FormsModule } from '@angular/forms';
import { Component, inject } from '@angular/core';
import { RecipeEditorStore } from '../../application/recipe-editor.store';
import type { Sensory } from '../../domain/recipe';

const SEASONING_OPTIONS = ['Low', 'Balanced', 'High'];
const ACIDITY_OPTIONS = ['Flat', 'Balanced', 'Bright'];
const TEXTURE_OPTIONS = ['Soft', 'Spot-On', 'Crisp'];

@Component({
  selector: 'app-tasting-notes',
  imports: [FormsModule],
  templateUrl: './tasting-notes.html',
  styleUrl: './tasting-notes.scss',
})
export class TastingNotes {
  protected readonly store = inject(RecipeEditorStore);
  protected readonly seasoningOptions = SEASONING_OPTIONS;
  protected readonly acidityOptions = ACIDITY_OPTIONS;
  protected readonly textureOptions = TEXTURE_OPTIONS;

  protected setSensory(patch: Partial<Sensory>): void {
    this.store.updateSensory(patch);
  }
}
