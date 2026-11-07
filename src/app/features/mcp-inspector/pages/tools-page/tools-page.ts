import { DecimalPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { type Tool, type ToolResult, toolArguments, toolFields } from '../../domain/tool';
import { McpClientService } from '../../infrastructure/api/mcp-client.service';

@Component({
  selector: 'app-tools-page',
  imports: [FormsModule, DecimalPipe, PageHeader],
  templateUrl: './tools-page.html',
  styleUrl: './tools-page.scss',
})
export class ToolsPage {
  private readonly mcp = inject(McpClientService);
  protected readonly tools = signal<Tool[]>([]);
  protected readonly filter = signal('');
  protected readonly error = signal<string | null>(null);
  protected readonly selected = signal<Tool | null>(null);
  protected readonly fields = computed(() => toolFields(this.selected()?.inputSchema ?? {}));
  protected values: Record<string, string> = {};
  protected readonly calling = signal(false);
  protected readonly result = signal<ToolResult | null>(null);
  protected readonly callError = signal<string | null>(null);
  protected readonly showRaw = signal(false);

  protected readonly shown = computed(() => {
    const needle = this.filter().trim().toLowerCase();
    if (!needle) return this.tools();
    return this.tools().filter(
      (tool) =>
        tool.name.toLowerCase().includes(needle) || tool.description.toLowerCase().includes(needle),
    );
  });

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.error.set(null);
    try {
      this.mcp.reset();
      this.tools.set(await this.mcp.tools());
    } catch (error) {
      this.error.set((error as Error).message);
    }
  }

  protected select(tool: Tool): void {
    this.selected.set(tool);
    this.result.set(null);
    this.callError.set(null);
    this.values = Object.fromEntries(
      toolFields(tool.inputSchema).map((field) => [field.name, field.initial]),
    );
  }

  protected async call(): Promise<void> {
    const tool = this.selected();
    if (!tool || this.calling()) return;
    this.calling.set(true);
    this.callError.set(null);
    this.result.set(null);
    try {
      this.result.set(
        await this.mcp.callTool(tool.name, toolArguments(this.fields(), this.values)),
      );
    } catch (error) {
      this.callError.set((error as Error).message);
    } finally {
      this.calling.set(false);
    }
  }

  protected json(value: unknown): string {
    return JSON.stringify(value, null, 2);
  }
}
