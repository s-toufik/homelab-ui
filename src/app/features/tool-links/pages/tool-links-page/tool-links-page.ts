import { Component, inject, signal } from '@angular/core';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { TOOL_UIS, TOOL_UI_GROUPS, type ToolLink, type ToolUi } from '../../domain/tool-links';

type Reachability = 'checking' | 'up' | 'down';

@Component({
  selector: 'app-tool-links-page',
  imports: [PageHeader],
  templateUrl: './tool-links-page.html',
  styleUrl: './tool-links-page.scss',
})
export class ToolLinksPage {
  private readonly server = inject(HomelabServer);
  protected readonly groups = TOOL_UI_GROUPS.map((group) => ({
    group,
    tools: TOOL_UIS.filter((tool) => tool.group === group),
  }));
  protected readonly status = signal<Record<string, Reachability>>({});

  constructor() {
    void this.check();
  }

  protected async check(): Promise<void> {
    this.status.set(Object.fromEntries(TOOL_UIS.map((tool) => [tool.id, 'checking'])));
    await Promise.all(
      TOOL_UIS.map(async (tool) => {
        const up = await this.server
          .isReachable({ key: tool.healthKey, port: tool.links[0].port, subpath: null })
          .catch(() => false);
        this.status.update((current) => ({ ...current, [tool.id]: up ? 'up' : 'down' }));
      }),
    );
  }

  protected href(link: ToolLink): string {
    if (link.scheme === 'http') return `http://${this.server.host}:${link.port}${link.path}`;
    return this.server.url({ port: link.port, subpath: null }, link.path);
  }

  protected address(tool: ToolUi): string {
    return this.href(tool.links[0])
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');
  }
}
