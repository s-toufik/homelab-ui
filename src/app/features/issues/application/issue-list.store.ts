import { Injectable, inject, signal } from '@angular/core';
import type { IssueReport, ReportStatus } from '../domain/report';
import { IssueRepository } from '../infrastructure/api/issue.repository';

@Injectable({ providedIn: 'root' })
export class IssueListStore {
  private readonly repo = inject(IssueRepository);

  readonly reports = signal<IssueReport[]>([]);
  readonly state = signal<'idle' | 'loading' | 'loaded' | 'error'>('idle');
  readonly error = signal<string | null>(null);

  async load(): Promise<void> {
    this.state.set('loading');
    this.error.set(null);
    try {
      this.reports.set(await this.repo.list());
      this.state.set('loaded');
    } catch (error) {
      this.state.set('error');
      this.error.set(error instanceof Error ? error.message : 'Could not load the reports.');
    }
  }

  async setStatus(id: string, status: ReportStatus): Promise<void> {
    const previous = this.reports();
    this.reports.set(previous.map((r) => (r.id === id ? { ...r, status } : r)));
    try {
      await this.repo.updateStatus(id, status);
    } catch (error) {
      this.reports.set(previous);
      this.error.set(error instanceof Error ? error.message : 'Could not update the status.');
    }
  }
}
