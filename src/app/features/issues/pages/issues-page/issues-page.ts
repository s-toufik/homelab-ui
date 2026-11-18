import { DatePipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccessStore } from '@shell/application/access.store';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { IssueListStore } from '../../application/issue-list.store';
import { IssueReportStore } from '../../application/issue-report.store';
import { ScreenshotPicker } from '../../components/screenshot-picker/screenshot-picker';
import { REPORT_STATUSES, STATUS_LABEL, type ReportStatus } from '../../domain/report';

@Component({
  selector: 'app-issues-page',
  imports: [FormsModule, DatePipe, PageHeader, ScreenshotPicker],
  templateUrl: './issues-page.html',
  styleUrl: './issues-page.scss',
})
export class IssuesPage {
  protected readonly access = inject(AccessStore);
  protected readonly form = inject(IssueReportStore);
  protected readonly list = inject(IssueListStore);
  protected readonly statuses = REPORT_STATUSES;
  protected readonly statusLabel = STATUS_LABEL;

  constructor() {
    if (this.access.isAdmin()) void this.list.load();
  }

  protected async submit(): Promise<void> {
    await this.form.submit();
  }

  protected onStatusChange(id: string, event: Event): void {
    const status = (event.target as HTMLSelectElement).value as ReportStatus;
    void this.list.setStatus(id, status);
  }

  protected badgeClass(status: ReportStatus): string {
    if (status === 'fixed') return 'hl-badge--ok';
    if (status === 'wont_fix') return 'hl-badge--muted';
    return 'hl-badge--warn';
  }
}
