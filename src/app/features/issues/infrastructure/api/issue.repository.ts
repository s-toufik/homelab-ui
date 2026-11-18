import { Injectable, inject } from '@angular/core';
import { GatewayApi } from '@shared/infrastructure/gateway-api';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import type { IssueReport, NewReport, ReportStatus } from '../../domain/report';
import ISSUES_API from '../issues.json';

interface ReportRow {
  readonly id: string;
  readonly reporter: string;
  readonly title: string;
  readonly description: string;
  readonly page_path: string;
  readonly user_agent: string;
  readonly screenshot_data_url: string | null;
  readonly status: ReportStatus;
  readonly created_at: string;
}

function toReport(row: ReportRow): IssueReport {
  return {
    id: row.id,
    reporter: row.reporter,
    title: row.title,
    description: row.description,
    pagePath: row.page_path,
    userAgent: row.user_agent,
    screenshotDataUrl: row.screenshot_data_url,
    status: row.status,
    createdAt: row.created_at,
  };
}

@Injectable({ providedIn: 'root' })
export class IssueRepository {
  private readonly api = inject(GatewayApi);
  private readonly server = inject(HomelabServer);

  async create(report: NewReport): Promise<void> {
    await this.api.send(this.server.api(ISSUES_API, '/reports'), {
      method: 'POST',
      body: {
        title: report.title,
        description: report.description,
        page_path: report.pagePath,
        user_agent: report.userAgent,
        screenshot_data_url: report.screenshotDataUrl,
      },
    });
  }

  async list(): Promise<IssueReport[]> {
    const rows = await this.api.json<ReportRow[]>(
      this.server.api(ISSUES_API, '/reports?select=*&order=created_at.desc'),
    );
    return rows.map(toReport);
  }

  async updateStatus(id: string, status: ReportStatus): Promise<void> {
    await this.api.send(this.server.api(ISSUES_API, `/reports?id=eq.${encodeURIComponent(id)}`), {
      method: 'PATCH',
      body: { status },
    });
  }
}
