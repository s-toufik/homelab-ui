import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { copyText } from '@shared/utils/clipboard';
import { PeopleStore } from '../../application/people.store';
import { PAGE_GROUPS, USERNAME_PATTERN, isEmail, peopleError } from '../../domain/person';

type Step = 1 | 2 | 3;

@Component({
  selector: 'app-new-person-page',
  imports: [PageHeader, FormsModule, RouterLink],
  templateUrl: './new-person-page.html',
  styleUrl: './new-person-page.scss',
})
export class NewPersonPage {
  protected readonly store = inject(PeopleStore);
  protected readonly step = signal<Step>(1);
  protected readonly username = signal('');
  protected readonly firstName = signal('');
  protected readonly lastName = signal('');
  protected readonly email = signal('');
  protected readonly chosen = signal<ReadonlySet<string>>(new Set());
  protected readonly saving = signal(false);
  protected readonly failure = signal<string | null>(null);
  protected readonly password = signal('');
  protected readonly copied = signal(false);

  protected readonly usernameTaken = computed(() =>
    this.store.people().some((person) => person.username === this.username().trim()),
  );
  protected readonly usernameValid = computed(() => USERNAME_PATTERN.test(this.username().trim()));
  protected readonly emailValid = computed(
    () => this.email().trim() === '' || isEmail(this.email()),
  );
  protected readonly canContinue = computed(
    () =>
      this.usernameValid() &&
      !this.usernameTaken() &&
      this.firstName().trim() !== '' &&
      this.emailValid(),
  );
  protected readonly name = computed(() => this.firstName().trim() || this.username().trim());
  protected readonly groups = computed(() =>
    PAGE_GROUPS.map((group) => ({
      group,
      options: this.store.options().filter((option) => option.group === group),
    })).filter((entry) => entry.options.length > 0),
  );

  constructor() {
    if (this.store.people().length === 0) void this.store.load();
  }

  protected suggestUsername(): void {
    if (this.username()) return;
    this.username.set(
      this.firstName()
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[^a-z0-9._-]/g, ''),
    );
  }

  protected toggle(role: string): void {
    this.chosen.update((roles) => {
      const next = new Set(roles);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }

  protected async create(): Promise<void> {
    this.saving.set(true);
    this.failure.set(null);
    try {
      this.password.set(
        await this.store.create(
          {
            username: this.username().trim(),
            firstName: this.firstName().trim(),
            lastName: this.lastName().trim(),
            email: this.email().trim(),
          },
          [...this.chosen()],
        ),
      );
      this.step.set(3);
    } catch (error) {
      this.failure.set(peopleError(error, 'create the account'));
    } finally {
      this.saving.set(false);
    }
  }

  protected async copy(): Promise<void> {
    this.copied.set(await copyText(this.password()));
  }
}
