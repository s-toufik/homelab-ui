import { Injectable, inject } from '@angular/core';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import type { Tool, ToolResult } from '../../domain/tool';
import TOOLBOX from '../toolbox.json';

const PROTOCOL_VERSION = '2025-06-18';

interface JsonRpcResponse {
  id?: number;
  result?: unknown;
  error?: { code: number; message: string };
}

export function readRpc(contentType: string, text: string, id: number): JsonRpcResponse {
  if (contentType.includes('text/event-stream')) {
    for (const line of text.split('\n')) {
      if (!line.startsWith('data:')) continue;
      try {
        const message = JSON.parse(line.slice(5).trim()) as JsonRpcResponse;
        if (message.id === id) return message;
      } catch {
        continue;
      }
    }
    throw new Error('The toolbox closed the stream without an answer.');
  }
  return JSON.parse(text) as JsonRpcResponse;
}

@Injectable({ providedIn: 'root' })
export class McpClientService {
  private readonly gateway = inject(GatewaySession);
  private readonly url = inject(HomelabServer).api(TOOLBOX, '/mcp');
  private session: string | null = null;
  private nextId = 1;
  private ready: Promise<void> | null = null;

  async tools(): Promise<Tool[]> {
    const result = (await this.call('tools/list', {})) as { tools?: Partial<Tool>[] };
    return (result.tools ?? [])
      .map((tool) => ({
        name: tool.name ?? '',
        title: tool.title ?? tool.name ?? '',
        description: tool.description ?? '',
        inputSchema: tool.inputSchema ?? {},
      }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  async callTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const started = performance.now();
    const result = (await this.call('tools/call', { name, arguments: args }, 600_000)) as {
      content?: { type: string; text?: string }[];
      isError?: boolean;
      structuredContent?: unknown;
    };
    return {
      isError: !!result.isError,
      texts: (result.content ?? []).map((part) => part.text ?? `[${part.type}]`),
      raw: result,
      seconds: (performance.now() - started) / 1000,
    };
  }

  reset(): void {
    this.session = null;
    this.ready = null;
  }

  private async call(method: string, params: unknown, timeoutMs = 30_000): Promise<unknown> {
    this.ready ??= this.initialize().catch((error) => {
      this.ready = null;
      throw error;
    });
    await this.ready;
    try {
      return await this.request(method, params, timeoutMs);
    } catch (error) {
      if ((error as Error).message.includes('404')) {
        this.reset();
        this.ready = this.initialize();
        await this.ready;
        return this.request(method, params, timeoutMs);
      }
      throw error;
    }
  }

  private async initialize(): Promise<void> {
    this.session = null;
    await this.request('initialize', {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: {},
      clientInfo: { name: 'homelab-ui', version: '1' },
    });
    await this.post({ jsonrpc: '2.0', method: 'notifications/initialized' }, 10_000);
  }

  private async request(method: string, params: unknown, timeoutMs = 30_000): Promise<unknown> {
    const id = this.nextId++;
    const response = await this.post({ jsonrpc: '2.0', id, method, params }, timeoutMs);
    const message = readRpc(response.headers.get('Content-Type') ?? '', await response.text(), id);
    if (message.error) throw new Error(`${message.error.message} (${message.error.code})`);
    return message.result;
  }

  private async post(body: unknown, timeoutMs: number): Promise<Response> {
    const response = await fetch(this.url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json, text/event-stream',
        'X-Homelab-Request': '1',
        'MCP-Protocol-Version': PROTOCOL_VERSION,
        ...(this.session ? { 'Mcp-Session-Id': this.session } : {}),
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!response.ok) {
      if (response.status === 401 && this.gateway.enabled) this.gateway.signIn();
      throw new Error(`The toolbox answered ${response.status}.`);
    }
    this.session = response.headers.get('Mcp-Session-Id') ?? this.session;
    return response;
  }
}
