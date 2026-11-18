export const REPORT_STATUSES = ['open', 'fixed', 'wont_fix'] as const;
export type ReportStatus = (typeof REPORT_STATUSES)[number];

export const STATUS_LABEL: Readonly<Record<ReportStatus, string>> = {
  open: 'Open',
  fixed: 'Fixed',
  wont_fix: "Won't fix",
};

export const TITLE_MAX = 200;
export const DESCRIPTION_MAX = 4000;

export interface NewReport {
  readonly title: string;
  readonly description: string;
  readonly pagePath: string;
  readonly userAgent: string;
  readonly screenshotDataUrl: string | null;
}

export interface IssueReport {
  readonly id: string;
  readonly reporter: string;
  readonly title: string;
  readonly description: string;
  readonly pagePath: string;
  readonly userAgent: string;
  readonly screenshotDataUrl: string | null;
  readonly status: ReportStatus;
  readonly createdAt: string;
}
