export type TargetHealth = 'up' | 'down' | 'unknown';

export interface ScrapeTarget {
  job: string;
  instance: string;
  url: string;
  health: TargetHealth;
  lastError: string;
  lastScrape: string;
  durationSeconds: number;
}

export type AlertState = 'firing' | 'pending' | 'inactive';

export interface AlertRule {
  group: string;
  name: string;
  query: string;
  state: AlertState;
  health: string;
  summary: string;
  activeSince: string | null;
  firing: number;
}

export interface RecordingRule {
  group: string;
  name: string;
  query: string;
  health: string;
}

export interface RulesOverview {
  alerts: AlertRule[];
  recordings: RecordingRule[];
}
