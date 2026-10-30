import { Injectable } from '@angular/core';
import { resolveTemplate } from '../../domain/template';
import type { HttpConfig } from '../../domain/workflow';

export interface HttpResult {
  readonly status: number;
  readonly body: unknown;
}

@Injectable({ providedIn: 'root' })
export class HttpBlockRunner {
  async run(config: HttpConfig, results: ReadonlyMap<string, unknown>): Promise<HttpResult> {
    const url = resolveTemplate(config.url, results);
    const headers: Record<string, string> = {};
    for (const header of config.headers) {
      if (header.key.trim() === '') continue;
      headers[header.key] = resolveTemplate(header.value, results);
    }
    const body = config.method === 'GET' ? undefined : resolveTemplate(config.body, results);

    const response = await fetch(url, { method: config.method, headers, body });
    const text = await response.text();
    return { status: response.status, body: parseBody(text) };
  }
}

function parseBody(text: string): unknown {
  if (text === '') return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}
