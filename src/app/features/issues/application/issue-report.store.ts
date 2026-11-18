import { Injectable, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { DESCRIPTION_MAX, TITLE_MAX } from '../domain/report';
import { IssueRepository } from '../infrastructure/api/issue.repository';
import { fileToResizedDataUrl } from '../infrastructure/image-resize';

export type SubmitState = 'idle' | 'submitting' | 'sent' | 'error';

@Injectable({ providedIn: 'root' })
export class IssueReportStore {
  private readonly repo = inject(IssueRepository);
  private readonly router = inject(Router);

  readonly title = signal('');
  readonly description = signal('');
  readonly screenshot = signal<string | null>(null);
  readonly screenshotName = signal<string | null>(null);
  readonly state = signal<SubmitState>('idle');
  readonly error = signal<string | null>(null);

  async attach(file: Blob, name: string): Promise<void> {
    this.error.set(null);
    try {
      this.screenshot.set(await fileToResizedDataUrl(file));
      this.screenshotName.set(name);
    } catch {
      this.error.set("Couldn't read that image — try a different file.");
    }
  }

  clearScreenshot(): void {
    this.screenshot.set(null);
    this.screenshotName.set(null);
  }

  async submit(): Promise<boolean> {
    const title = this.title().trim();
    const description = this.description().trim();
    if (!title || !description) {
      this.error.set('Add a short title and describe what happened.');
      return false;
    }

    this.state.set('submitting');
    this.error.set(null);
    try {
      await this.repo.create({
        title: title.slice(0, TITLE_MAX),
        description: description.slice(0, DESCRIPTION_MAX),
        pagePath: this.router.url,
        userAgent: navigator.userAgent,
        screenshotDataUrl: this.screenshot(),
      });
      this.state.set('sent');
      this.title.set('');
      this.description.set('');
      this.clearScreenshot();
      return true;
    } catch (error) {
      this.state.set('error');
      this.error.set(error instanceof Error ? error.message : 'Could not send the report.');
      return false;
    }
  }

  reset(): void {
    this.state.set('idle');
    this.error.set(null);
  }
}
