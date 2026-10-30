import * as Rete from 'rete';
import { AreaPlugin, type RenderSignal } from 'rete-area-plugin';
import { ConnectionPlugin, Presets as ConnectionPresets } from 'rete-connection-plugin';
import { blockKindMeta } from '../../domain/block-kind';
import type {
  CanvasEngine,
  CanvasEngineCallbacks,
  CanvasEngineState,
} from '../../domain/canvas-engine';
import type { BlockConfig, WorkflowBlock, WorkflowConnection } from '../../domain/workflow';
import { injectCanvasEngineStyles } from './rete-canvas-engine.styles';

const NODE_WIDTH = 220;
const NODE_HEIGHT = 92;
const INPUT_KEY = 'input';
const OUTPUT_KEY = 'output';

type Position = { x: number; y: number };
type Node = Rete.ClassicPreset.Node;
type Connection = Rete.ClassicPreset.Connection<Node, Node> & { isPseudo?: boolean };
type Schemes = Rete.GetSchemes<Node, Connection>;
type SocketRenderSignal = RenderSignal<
  'socket',
  { nodeId: string; side: 'input' | 'output'; key: string }
>;

interface RenderData {
  readonly type: string;
  readonly element: HTMLElement;
  readonly payload?: unknown;
  readonly start?: Position;
  readonly end?: Position;
}

const socket = new Rete.ClassicPreset.Socket('block');

export class ReteCanvasEngine implements CanvasEngine {
  private editor?: Rete.NodeEditor<Schemes>;
  private area?: AreaPlugin<Schemes, SocketRenderSignal>;
  private callbacks?: CanvasEngineCallbacks;

  private state: CanvasEngineState = { blocks: [], connections: [], selectedIds: [], results: {} };
  private pending: CanvasEngineState | null = null;
  private signatures = new Map<string, string>();
  private selectedIds = new Set<string>();
  private placing = new Set<string>();

  async mount(host: HTMLElement, callbacks: CanvasEngineCallbacks): Promise<void> {
    injectCanvasEngineStyles();
    host.classList.add('tasker-rete-canvas-host');
    this.callbacks = callbacks;

    const editor = new Rete.NodeEditor<Schemes>();
    const area = new AreaPlugin<Schemes, SocketRenderSignal>(host);
    const connection = new ConnectionPlugin<Schemes>();

    editor.use(area);
    area.use(connection);
    connection.addPreset(ConnectionPresets.classic.setup());

    area.addPipe((context) => {
      if (context.type === 'render') this.render(context.data as RenderData);
      if (context.type === 'nodetranslated') this.handleTranslated(context.data.id);
      return context;
    });

    editor.addPipe((context) => {
      if (context.type === 'connectioncreated') {
        const created = context.data;
        this.callbacks?.onConnect(created.source, created.target, created.id);
      }
      if (context.type === 'connectionremoved') {
        this.callbacks?.onDisconnect(context.data.id);
      }
      return context;
    });

    host.addEventListener('pointerdown', (event) => {
      if (event.target === host) this.callbacks?.onSelect(null, false);
    });

    this.editor = editor;
    this.area = area;

    if (this.pending) {
      const state = this.pending;
      this.pending = null;
      await this.apply(state);
    }
  }

  sync(state: CanvasEngineState): void {
    if (!this.editor || !this.area) {
      this.pending = state;
      return;
    }
    void this.apply(state);
  }

  async fitView(): Promise<void> {
    const area = this.area;
    if (!area || this.state.blocks.length === 0) return;

    const xs = this.state.blocks.flatMap((block) => [block.x, block.x + NODE_WIDTH]);
    const ys = this.state.blocks.flatMap((block) => [block.y, block.y + NODE_HEIGHT]);
    const left = Math.min(...xs);
    const right = Math.max(...xs);
    const top = Math.min(...ys);
    const bottom = Math.max(...ys);
    const boxWidth = Math.max(1, right - left);
    const boxHeight = Math.max(1, bottom - top);

    const rect = area.container.getBoundingClientRect();
    const padding = 80;
    const scale = Math.min((rect.width - padding) / boxWidth, (rect.height - padding) / boxHeight);
    const k = Math.min(1, Math.max(0.2, scale));

    const centerX = (left + right) / 2;
    const centerY = (top + bottom) / 2;

    await area.area.zoom(k);
    await area.area.translate(rect.width / 2 - centerX * k, rect.height / 2 - centerY * k);
  }

  destroy(): void {
    this.area?.destroy();
  }

  private async apply(state: CanvasEngineState): Promise<void> {
    const editor = this.editor;
    const area = this.area;
    if (!editor || !area) return;

    const previous = this.state;
    this.state = state;

    const blockIds = new Set(state.blocks.map((block) => block.id));
    const previousIds = new Set(previous.blocks.map((block) => block.id));

    for (const block of previous.blocks) {
      if (!blockIds.has(block.id)) await this.removeNode(block.id);
    }
    for (const block of state.blocks) {
      if (!previousIds.has(block.id)) await this.addNode(block);
    }

    const connectionIds = new Set(state.connections.map((item) => item.id));
    const previousConnectionIds = new Set(previous.connections.map((item) => item.id));

    for (const item of previous.connections) {
      if (!connectionIds.has(item.id) && editor.getConnection(item.id)) {
        await editor.removeConnection(item.id);
      }
    }
    for (const item of state.connections) {
      if (!previousConnectionIds.has(item.id)) await this.addConnection(item);
    }

    for (const block of state.blocks) {
      const view = area.nodeViews.get(block.id);
      if (view && (view.position.x !== block.x || view.position.y !== block.y)) {
        await this.place(block);
      }

      const signature = JSON.stringify({ config: block.config, result: state.results[block.id] });
      if (this.signatures.get(block.id) !== signature) {
        this.signatures.set(block.id, signature);
        await area.update('node', block.id);
      }
    }

    const nextSelected = new Set(state.selectedIds);
    const changed = [
      ...[...this.selectedIds].filter((id) => !nextSelected.has(id)),
      ...[...nextSelected].filter((id) => !this.selectedIds.has(id)),
    ];
    this.selectedIds = nextSelected;
    for (const id of changed) {
      if (editor.getNode(id)) await area.update('node', id);
    }

    for (const item of state.connections) {
      await area.update('connection', item.id);
    }
  }

  private async addNode(block: WorkflowBlock): Promise<void> {
    const editor = this.editor;
    const area = this.area;
    if (!editor || !area) return;
    const meta = blockKindMeta(block.config.kind);
    const node = new Rete.ClassicPreset.Node(meta.label);
    node.id = block.id;
    if (meta.hasInput) node.addInput(INPUT_KEY, new Rete.ClassicPreset.Input(socket, 'In'));
    if (meta.hasOutput) node.addOutput(OUTPUT_KEY, new Rete.ClassicPreset.Output(socket, 'Out'));
    this.placing.add(block.id);
    try {
      await editor.addNode(node);
    } finally {
      this.placing.delete(block.id);
    }
    await this.place(block);
  }

  private async place(block: WorkflowBlock): Promise<void> {
    this.placing.add(block.id);
    try {
      await this.area?.translate(block.id, { x: block.x, y: block.y });
    } finally {
      this.placing.delete(block.id);
    }
  }

  private async removeNode(id: string): Promise<void> {
    const editor = this.editor;
    if (!editor) return;
    for (const connection of editor.getConnections()) {
      if (connection.source === id || connection.target === id) {
        await editor.removeConnection(connection.id);
      }
    }
    if (editor.getNode(id)) await editor.removeNode(id);
  }

  private async addConnection(item: WorkflowConnection): Promise<void> {
    const editor = this.editor;
    if (!editor || editor.getConnection(item.id)) return;
    const source = editor.getNode(item.fromId);
    const target = editor.getNode(item.toId);
    if (!source || !target) return;
    const edge = new Rete.ClassicPreset.Connection(source, OUTPUT_KEY, target, INPUT_KEY);
    edge.id = item.id;
    await editor.addConnection(edge);
  }

  private handleTranslated(id: string): void {
    const area = this.area;
    if (!area) return;
    const view = area.nodeViews.get(id);
    if (view && !this.placing.has(id)) this.callbacks?.onMove(id, view.position.x, view.position.y);
    for (const connection of this.state.connections) {
      if (connection.fromId === id || connection.toId === id)
        void area.update('connection', connection.id);
    }
  }

  private render(data: RenderData): void {
    if (data.type === 'node') this.renderNode(data.element, data.payload as Node);
    if (data.type === 'connection') {
      this.renderConnection(data.element, data.payload as Connection, data.start, data.end);
    }
  }

  private renderNode(element: HTMLElement, node: Node): void {
    const block = this.state.blocks.find((candidate) => candidate.id === node.id);
    if (!block) return;
    const meta = blockKindMeta(block.config.kind);
    const result = this.state.results[block.id];
    const classes = ['tasker-rete-node'];
    if (this.state.selectedIds.includes(block.id)) classes.push('tasker-rete-node--selected');
    if (block.config.kind === 'group') classes.push('tasker-rete-node--group');

    element.className = classes.join(' ');
    element.style.width = `${NODE_WIDTH}px`;
    element.style.height = `${NODE_HEIGHT}px`;
    element.replaceChildren();

    const body = document.createElement('div');
    body.className = 'tasker-rete-node__body';

    const icon = document.createElement('span');
    icon.className = 'tasker-rete-node__icon';
    icon.style.background = `${meta.color}22`;
    icon.style.color = meta.color;
    icon.innerHTML = iconMarkup(meta.icon);

    const text = document.createElement('span');
    text.className = 'tasker-rete-node__text';
    const title = document.createElement('span');
    title.className = 'tasker-rete-node__title';
    title.textContent = block.config.kind === 'group' ? block.config.name : meta.label;
    const subtitle = document.createElement('span');
    subtitle.className = 'tasker-rete-node__subtitle';
    subtitle.textContent = subtitleFor(block.config);
    text.append(title, subtitle);

    const status = document.createElement('span');
    status.className = `tasker-rete-node__status tasker-rete-node__status--${result?.status ?? 'idle'}`;

    body.append(icon, text, status);
    body.addEventListener('pointerdown', (event) => {
      this.callbacks?.onSelect(block.id, event.shiftKey || event.metaKey || event.ctrlKey);
    });
    element.appendChild(body);

    if (meta.hasInput) {
      const port = document.createElement('div');
      port.className = 'tasker-rete-node__port tasker-rete-node__port--input';
      element.appendChild(port);
      this.area?.emit({
        type: 'render',
        data: { type: 'socket', element: port, nodeId: node.id, side: 'input', key: INPUT_KEY },
      });
    }
    if (meta.hasOutput) {
      const port = document.createElement('div');
      port.className = 'tasker-rete-node__port tasker-rete-node__port--output';
      element.appendChild(port);
      this.area?.emit({
        type: 'render',
        data: { type: 'socket', element: port, nodeId: node.id, side: 'output', key: OUTPUT_KEY },
      });
    }
  }

  private renderConnection(
    element: HTMLElement,
    connection: Connection,
    start?: Position,
    end?: Position,
  ): void {
    element.className = `tasker-rete-connection${connection.isPseudo ? ' tasker-rete-connection--preview' : ''}`;
    const from = start ?? this.portPosition(connection.source, 'output');
    const to = end ?? this.portPosition(connection.target, 'input');
    const dx = Math.max(60, Math.abs(to.x - from.x) / 2);
    const d = `M ${from.x} ${from.y} C ${from.x + dx} ${from.y}, ${to.x - dx} ${to.y}, ${to.x} ${to.y}`;

    element.replaceChildren();
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('width', '100%');
    svg.setAttribute('height', '100%');
    svg.style.position = 'absolute';
    svg.style.inset = '0';
    svg.style.overflow = 'visible';
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('d', d);
    path.setAttribute('class', 'tasker-rete-connection__path');
    path.addEventListener('click', (event) => {
      event.stopPropagation();
      if (!connection.isPseudo) this.callbacks?.onDisconnect(connection.id);
    });
    svg.appendChild(path);
    element.appendChild(svg);
  }

  private portPosition(nodeId: string, side: 'output' | 'input'): Position {
    const view = this.area?.nodeViews.get(nodeId);
    const position = view?.position ?? { x: 0, y: 0 };
    return side === 'output'
      ? { x: position.x + NODE_WIDTH, y: position.y + NODE_HEIGHT / 2 }
      : { x: position.x, y: position.y + NODE_HEIGHT / 2 };
  }
}

function subtitleFor(config: BlockConfig): string {
  switch (config.kind) {
    case 'trigger':
      return 'Manual run';
    case 'code':
      return config.script.trim() || 'No script set';
    case 'http':
      return config.url.trim() ? `${config.method} ${config.url}` : 'No URL set';
    case 'transform':
      return config.mappings.length ? `${config.mappings.length} field(s)` : 'No fields mapped';
    case 'output':
      return 'Shows the final result';
    case 'group':
      return `${config.blocks.length} blocks inside`;
  }
}

function iconMarkup(paths: readonly string[]): string {
  const body = paths.map((d) => `<path d="${d}"></path>`).join('');
  return `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${body}</svg>`;
}
