import { Injectable, inject } from '@angular/core';
import type { WorkflowRepository } from '../../domain/repositories';
import {
  UNTITLED_WORKFLOW,
  sanitizeGraph,
  type WorkflowDocument,
  type WorkflowSummary,
} from '../../domain/workflow';
import { PostgrestClient } from './postgrest-client';

interface WorkflowRow {
  readonly id: string;
  readonly name: string;
  readonly blocks?: unknown;
  readonly connections?: unknown;
  readonly updated_at: string;
}

const UPSERT = { Prefer: 'resolution=merge-duplicates,return=representation' };

@Injectable({ providedIn: 'root' })
export class PostgrestWorkflowRepository implements WorkflowRepository {
  private readonly client = inject(PostgrestClient);

  async list(): Promise<WorkflowSummary[]> {
    const rows = await this.client.request<WorkflowRow[]>(
      '/workflows?select=id,name,updated_at&order=updated_at.desc',
    );
    return rows.map(toSummary);
  }

  async get(id: string): Promise<WorkflowDocument> {
    const rows = await this.client.request<WorkflowRow[]>(
      `/workflows?id=eq.${encodeURIComponent(id)}&select=*`,
    );
    const row = rows[0];
    if (!row) throw new Error('This workflow no longer exists in the database');
    return { id: row.id, name: row.name || UNTITLED_WORKFLOW, ...sanitizeGraph(row) };
  }

  async save(document: WorkflowDocument): Promise<WorkflowSummary> {
    const rows = await this.client.request<WorkflowRow[]>('/workflows', {
      method: 'POST',
      headers: UPSERT,
      body: JSON.stringify({
        id: document.id,
        name: document.name.trim().slice(0, 200) || UNTITLED_WORKFLOW,
        blocks: document.blocks,
        connections: document.connections,
        updated_at: new Date().toISOString(),
      }),
    });
    return toSummary(rows[0]);
  }

  async remove(id: string): Promise<void> {
    await this.client.request(`/workflows?id=eq.${encodeURIComponent(id)}`, { method: 'DELETE' });
  }
}

function toSummary(row: WorkflowRow): WorkflowSummary {
  return { id: row.id, name: row.name || UNTITLED_WORKFLOW, updatedAt: row.updated_at };
}
