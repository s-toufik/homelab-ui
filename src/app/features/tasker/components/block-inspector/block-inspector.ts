import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { BlockFavoritesStore } from '../../application/block-favorites.store';
import { WorkspaceStore } from '../../application/workspace.store';
import { blockKindMeta } from '../../domain/block-kind';
import type {
  BlockConfig,
  CodeConfig,
  FieldMapping,
  GroupConfig,
  HttpConfig,
  HttpHeader,
  TransformConfig,
} from '../../domain/workflow';

@Component({
  selector: 'app-block-inspector',
  imports: [FormsModule],
  templateUrl: './block-inspector.html',
  styleUrl: './block-inspector.scss',
})
export class BlockInspector {
  protected readonly workspace = inject(WorkspaceStore);
  protected readonly favorites = inject(BlockFavoritesStore);
  protected readonly document = this.workspace.activeDocument;
  protected readonly block = computed(() => this.document()?.selectedBlock() ?? null);
  protected readonly selectionCount = computed(() => this.document()?.selectedBlocks().length ?? 0);
  protected readonly meta = computed(() => {
    const block = this.block();
    return block ? blockKindMeta(block.config.kind) : null;
  });

  protected readonly savingName = signal<string | null>(null);
  protected readonly groupName = signal('Group');

  constructor() {
    effect(() => {
      this.block();
      this.selectionCount();
      this.savingName.set(null);
    });
  }

  protected patchCode(patch: Partial<CodeConfig>): void {
    this.patch('code', patch);
  }

  protected patchHttp(patch: Partial<HttpConfig>): void {
    this.patch('http', patch);
  }

  protected patchTransform(patch: Partial<TransformConfig>): void {
    this.patch('transform', patch);
  }

  protected patchGroup(patch: Partial<GroupConfig>): void {
    this.patch('group', patch);
  }

  addHeader(): void {
    const config = this.configOf('http');
    if (config) this.patchHttp({ headers: [...config.headers, { key: '', value: '' }] });
  }

  updateHeader(index: number, header: HttpHeader): void {
    const config = this.configOf('http');
    if (!config) return;
    this.patchHttp({
      headers: config.headers.map((candidate, i) => (i === index ? header : candidate)),
    });
  }

  removeHeader(index: number): void {
    const config = this.configOf('http');
    if (config) this.patchHttp({ headers: config.headers.filter((_, i) => i !== index) });
  }

  addMapping(): void {
    const config = this.configOf('transform');
    if (config) this.patchTransform({ mappings: [...config.mappings, { from: '', to: '' }] });
  }

  updateMapping(index: number, mapping: FieldMapping): void {
    const config = this.configOf('transform');
    if (!config) return;
    this.patchTransform({
      mappings: config.mappings.map((candidate, i) => (i === index ? mapping : candidate)),
    });
  }

  removeMapping(index: number): void {
    const config = this.configOf('transform');
    if (config) this.patchTransform({ mappings: config.mappings.filter((_, i) => i !== index) });
  }

  groupSelection(): void {
    const name = this.groupName().trim() || 'Group';
    if (this.document()?.groupSelected(name)) this.groupName.set('Group');
  }

  startSaveFavorite(): void {
    const block = this.block();
    this.savingName.set(block?.config.kind === 'group' ? block.config.name : '');
  }

  cancelSaveFavorite(): void {
    this.savingName.set(null);
  }

  async confirmSaveFavorite(): Promise<void> {
    const block = this.block();
    const name = this.savingName()?.trim();
    if (!block || !name) return;
    if (await this.favorites.add(name, block.config)) this.savingName.set(null);
  }

  runSelected(): void {
    const block = this.block();
    if (block) void this.document()?.runOne(block.id);
  }

  formatOutput(output: unknown): string {
    if (output === undefined) return '';
    if (typeof output === 'string') return output;
    try {
      return JSON.stringify(output, null, 2);
    } catch {
      return String(output);
    }
  }

  private configOf<K extends BlockConfig['kind']>(
    kind: K,
  ): Extract<BlockConfig, { kind: K }> | null {
    const config = this.block()?.config;
    return config?.kind === kind ? (config as Extract<BlockConfig, { kind: K }>) : null;
  }

  private patch<K extends BlockConfig['kind']>(
    kind: K,
    patch: Partial<Extract<BlockConfig, { kind: K }>>,
  ): void {
    const block = this.block();
    const config = this.configOf(kind);
    if (!block || !config) return;
    this.document()?.updateConfig(block.id, { ...config, ...patch } as BlockConfig);
  }
}
