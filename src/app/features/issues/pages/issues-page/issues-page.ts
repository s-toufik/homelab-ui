import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AccessStore } from '@shell/application/access.store';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { IssueListStore } from '../../application/issue-list.store';
import { IssueReportStore } from '../../application/issue-report.store';
import { ScreenshotPicker } from '../../components/screenshot-picker/screenshot-picker';
import { STATUS_LABEL, type IssueReport, type ReportStatus } from '../../domain/report';

const GROUP_ORDER: readonly ReportStatus[] = ['open', 'wont_fix', 'fixed'];
const GROUP_LABEL: Readonly<Record<ReportStatus, string>> = {
  open: 'Open',
  wont_fix: 'Skipped',
  fixed: 'Fixed',
};

interface ReportGroup {
  readonly status: ReportStatus;
  readonly label: string;
  readonly reports: readonly IssueReport[];
}

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
  protected readonly statuses = GROUP_ORDER;
  protected readonly statusLabel = STATUS_LABEL;

  protected readonly peeking = signal<string | null>(null);

  protected readonly groups = computed<ReportGroup[]>(() => {
    const reports = this.list.reports();
    return GROUP_ORDER.map((status) => ({
      status,
      label: GROUP_LABEL[status],
      reports: reports.filter((report) => report.status === status),
    }));
  });

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

  protected togglePeek(id: string): void {
    this.peeking.set(this.peeking() === id ? null : id);
  }
}
