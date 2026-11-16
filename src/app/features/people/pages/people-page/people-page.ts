import { DatePipe } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { copyText } from '@shared/utils/clipboard';
import { PeopleStore } from '../../application/people.store';
import {
  PAGE_GROUPS,
  displayName,
  isAdmin,
  pagesOf,
  type PageOption,
  type Person,
} from '../../domain/person';

@Component({
  selector: 'app-people-page',
  imports: [RouterLink, DatePipe],
  templateUrl: './people-page.html',
  styleUrl: './people-page.scss',
})
export class PeoplePage {
  protected readonly store = inject(PeopleStore);
  protected readonly selectedId = signal<string | null>(null);
  protected readonly revealed = signal<{ id: string; password: string } | null>(null);
  protected readonly copied = signal(false);
  protected readonly deleting = signal<string | null>(null);
  protected readonly displayName = displayName;
  protected readonly isAdmin = isAdmin;

  protected readonly selected = computed(
    () => this.store.people().find((person) => person.id === this.selectedId()) ?? null,
  );
  protected readonly groups = computed(() =>
    PAGE_GROUPS.map((group) => ({
      group,
      hue: group === 'Assistants' ? 'orange' : group === 'Apps' ? 'purple' : 'teal',
      options: this.store.options().filter((option) => option.group === group),
    })).filter((entry) => entry.options.length > 0),
  );

  constructor() {
    void this.store.load();
    effect(() => {
      const people = this.store.people();
      if (!this.selectedId() && people.length && globalThis.innerWidth >= 768) {
        this.selectedId.set((people.find((p) => !isAdmin(p)) ?? people[0]).id);
      }
    });
  }

  protected summary(person: Person): string {
    if (isAdmin(person))
      return person.username === this.store.me() ? 'Admin · you' : 'Admin · everything';
    if (!person.enabled) return 'Disabled';
    const pages = pagesOf(person, this.store.options()).map((page) => page.label);
    return pages.length ? pages.join(', ') : 'No pages yet';
  }

  protected has(person: Person, option: PageOption): boolean {
    return isAdmin(person) || person.roles.includes(option.role);
  }

  protected select(person: Person): void {
    this.revealed.set(null);
    this.selectedId.set(person.id);
  }

  protected async removePerson(person: Person): Promise<void> {
    if (this.deleting() !== person.id) {
      this.deleting.set(person.id);
      return;
    }
    this.deleting.set(null);
    if (await this.store.remove(person)) this.selectedId.set(null);
  }

  protected async newPassword(person: Person): Promise<void> {
    const password = await this.store.resetPassword(person);
    if (password) {
      this.copied.set(false);
      this.revealed.set({ id: person.id, password });
    }
  }

  protected async copy(password: string): Promise<void> {
    this.copied.set(await copyText(password));
  }
}
