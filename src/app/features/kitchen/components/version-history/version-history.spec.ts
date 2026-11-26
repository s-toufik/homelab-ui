import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { RecipeEditorStore } from '../../application/recipe-editor.store';
import { RecipeRepository } from '../../infrastructure/api/recipe.repository';
import { VersionHistory } from './version-history';

function render(): ComponentFixture<VersionHistory> {
  TestBed.configureTestingModule({
    providers: [{ provide: RecipeRepository, useValue: { list: () => new Promise(() => {}) } }],
  });
  const fixture = TestBed.createComponent(VersionHistory);
  fixture.detectChanges();
  return fixture;
}

function saveButton(fixture: ComponentFixture<VersionHistory>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('button');
}

describe('VersionHistory', () => {
  it('names the action: Create for a new recipe, then Save, Saving… while it saves', () => {
    const fixture = render();
    expect(saveButton(fixture).textContent?.trim()).toBe('Create');
    expect(saveButton(fixture).getAttribute('aria-label')).toBe('Create recipe');

    const store = TestBed.inject(RecipeEditorStore);
    store.recipeId.set('r1');
    fixture.detectChanges();
    expect(saveButton(fixture).textContent?.trim()).toBe('Save');
    expect(saveButton(fixture).getAttribute('aria-label')).toBe('Save version');

    store.state.set('saving');
    fixture.detectChanges();
    expect(saveButton(fixture).textContent?.trim()).toBe('Saving…');
    expect(saveButton(fixture).disabled).toBe(true);
  });
});
