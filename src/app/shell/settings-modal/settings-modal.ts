import { Component, HostListener, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  DEFAULT_CONNECTION_SETTINGS,
  type ServiceAddressOverride,
} from '@shared/infrastructure/connection-settings';
import { ConnectionSettingsStorage } from '@shared/infrastructure/connection-settings.storage';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import { FeatureStatusStore } from '../application/feature-status.store';
import { SettingsModalStore } from '../application/settings-modal.store';
import { ThemeStore } from '../application/theme.store';
import { CONNECTABLE_SERVICES } from '../domain/connectable-services';
import { SETTINGS_TABS, type SettingsTab } from '../domain/settings-tab';
import { CREATIVE_THEMES, type ThemePaletteId } from '../domain/theme-preferences';

interface ServiceDraft {
  readonly key: string;
  readonly label: string;
  readonly port: string;
  readonly subpath: string;
  readonly defaultPort: number | null;
  readonly defaultSubpath: string | null;
}

const TAB_LABELS: Readonly<Record<SettingsTab, string>> = {
  general: 'General',
  connectors: 'Connectors',
  appearance: 'Appearance',
  about: 'About',
};

function normalizeHost(value: string): string {
  return /^[a-z][a-z0-9+.-]*:\/\//i.test(value) ? value : `http://${value}`;
}

@Component({
  selector: 'app-settings-modal',
  imports: [FormsModule],
  templateUrl: './settings-modal.html',
  styleUrl: './settings-modal.scss',
})
export class SettingsModal {
  protected readonly store = inject(SettingsModalStore);
  private readonly theme = inject(ThemeStore);
  private readonly connectionStorage = inject(ConnectionSettingsStorage);
  private readonly server = inject(HomelabServer);
  private readonly status = inject(FeatureStatusStore);
  private readonly savedConnections = this.connectionStorage.read();

  protected readonly tabs = SETTINGS_TABS;
  protected readonly tabLabels = TAB_LABELS;

  protected readonly host = this.server.host;
  protected readonly summary = computed(() => {
    const summary = this.status.summary();
    return summary ? `${summary.online} of ${summary.total} reachable` : 'Checking…';
  });

  protected readonly creativeThemes = CREATIVE_THEMES;
  protected readonly palette = this.theme.palette;

  protected readonly connectionHost = signal(
    this.savedConnections.host ?? this.server.url({ port: null, subpath: null }),
  );

  protected readonly services = signal<ServiceDraft[]>(
    CONNECTABLE_SERVICES.map((service) => {
      const override = this.savedConnections.overrides[service.key];
      return {
        key: service.key,
        label: service.label,
        port: override?.port != null ? String(override.port) : '',
        subpath: override?.subpath ?? '',
        defaultPort: service.default.port,
        defaultSubpath: service.default.subpath,
      };
    }),
  );

  protected readonly connectionsDirty = signal(false);

  @HostListener('document:keydown.escape')
  protected onEscape(): void {
    if (this.store.isOpen()) this.store.close();
  }

  selectTab(tab: SettingsTab): void {
    this.store.activeTab.set(tab);
  }

  refreshStatus(): void {
    void this.status.refresh();
  }

  setPalette(id: ThemePaletteId): void {
    this.theme.palette.set(id);
  }

  updateConnectionHost(value: string): void {
    this.connectionHost.set(value);
    this.connectionsDirty.set(true);
  }

  updateServicePort(key: string, value: string): void {
    this.services.update((services) =>
      services.map((service) => (service.key === key ? { ...service, port: value } : service)),
    );
    this.connectionsDirty.set(true);
  }

  updateServiceSubpath(key: string, value: string): void {
    this.services.update((services) =>
      services.map((service) => (service.key === key ? { ...service, subpath: value } : service)),
    );
    this.connectionsDirty.set(true);
  }

  saveConnectionsAndReload(): void {
    const overrides: Record<string, ServiceAddressOverride> = {};
    for (const service of this.services()) {
      const port = service.port.trim();
      const subpath = service.subpath.trim();
      const entry: ServiceAddressOverride = {
        ...(port !== '' && !Number.isNaN(Number(port)) ? { port: Number(port) } : {}),
        ...(subpath !== '' ? { subpath } : {}),
      };
      if (Object.keys(entry).length > 0) overrides[service.key] = entry;
    }

    const host = this.connectionHost().trim();
    this.connectionStorage.write({
      host: host === '' ? null : normalizeHost(host),
      overrides,
    });
    location.reload();
  }

  resetConnections(): void {
    this.connectionStorage.write(DEFAULT_CONNECTION_SETTINGS);
    location.reload();
  }
}
