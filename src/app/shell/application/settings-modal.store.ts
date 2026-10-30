import { Injectable, signal } from '@angular/core';
import type { SettingsTab } from '../domain/settings-tab';

@Injectable({ providedIn: 'root' })
export class SettingsModalStore {
  readonly isOpen = signal(false);
  readonly activeTab = signal<SettingsTab>('general');

  open(tab: SettingsTab = 'general'): void {
    this.activeTab.set(tab);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
  }
}
