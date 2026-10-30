export type SplitDirection = 'row' | 'column';
export type DropEdge = 'left' | 'right' | 'top' | 'bottom' | 'center';

export interface PaneGroup {
  readonly type: 'group';
  readonly id: string;
  readonly tabs: readonly string[];
  readonly active: string | null;
}

export interface PaneSplit {
  readonly type: 'split';
  readonly id: string;
  readonly direction: SplitDirection;
  readonly children: readonly LayoutNode[];
  readonly sizes: readonly number[];
}

export type LayoutNode = PaneGroup | PaneSplit;

export const MIN_PANE_SIZE = 0.1;

export function createGroup(id: string, tabs: readonly string[] = []): PaneGroup {
  return { type: 'group', id, tabs, active: tabs[0] ?? null };
}

export function allGroups(node: LayoutNode): PaneGroup[] {
  return node.type === 'group' ? [node] : node.children.flatMap(allGroups);
}

export function findGroup(node: LayoutNode, groupId: string): PaneGroup | null {
  return allGroups(node).find((group) => group.id === groupId) ?? null;
}

export function groupOf(node: LayoutNode, docId: string): PaneGroup | null {
  return allGroups(node).find((group) => group.tabs.includes(docId)) ?? null;
}

export function openTabs(node: LayoutNode): string[] {
  return allGroups(node).flatMap((group) => group.tabs);
}

export function addTab(root: LayoutNode, groupId: string, docId: string): LayoutNode {
  return mapGroups(root, (group) => {
    if (group.id !== groupId) return group;
    const tabs = group.tabs.includes(docId) ? group.tabs : [...group.tabs, docId];
    return { ...group, tabs, active: docId };
  });
}

export function activateTab(root: LayoutNode, docId: string): LayoutNode {
  return mapGroups(root, (group) =>
    group.tabs.includes(docId) ? { ...group, active: docId } : group,
  );
}

export function closeTab(root: LayoutNode, docId: string): LayoutNode {
  return normalize(withoutTab(root, docId));
}

export function moveTab(
  root: LayoutNode,
  docId: string,
  targetGroupId: string,
  edge: DropEdge,
  newId: () => string,
): LayoutNode {
  const source = groupOf(root, docId);
  if (source?.id === targetGroupId && (edge === 'center' || source.tabs.length === 1)) {
    return activateTab(root, docId);
  }
  if (!findGroup(root, targetGroupId)) return root;

  const detached = source ? withoutTab(root, docId) : root;
  if (edge === 'center') return normalize(addTab(detached, targetGroupId, docId));

  const direction: SplitDirection = edge === 'left' || edge === 'right' ? 'row' : 'column';
  const before = edge === 'left' || edge === 'top';
  const fresh = createGroup(newId(), [docId]);
  const placed = mapGroups(detached, (group) => {
    if (group.id !== targetGroupId) return group;
    return {
      type: 'split',
      id: newId(),
      direction,
      children: before ? [fresh, group] : [group, fresh],
      sizes: [0.5, 0.5],
    };
  });
  return normalize(placed);
}

export function resizeSplit(
  root: LayoutNode,
  splitId: string,
  sizes: readonly number[],
): LayoutNode {
  if (root.type === 'group') return root;
  if (root.id === splitId && sizes.length === root.children.length) {
    return { ...root, sizes: scale(sizes) };
  }
  return { ...root, children: root.children.map((child) => resizeSplit(child, splitId, sizes)) };
}

export function normalize(root: LayoutNode): LayoutNode {
  return prune(root) ?? createGroup(allGroups(root)[0]?.id ?? 'pane', []);
}

export function isLayoutNode(value: unknown): value is LayoutNode {
  const node = value as LayoutNode | null;
  if (!node || typeof node.id !== 'string') return false;
  if (node.type === 'group') {
    return Array.isArray(node.tabs) && node.tabs.every((tab) => typeof tab === 'string');
  }
  return (
    node.type === 'split' &&
    (node.direction === 'row' || node.direction === 'column') &&
    Array.isArray(node.children) &&
    Array.isArray(node.sizes) &&
    node.children.length === node.sizes.length &&
    node.children.every(isLayoutNode)
  );
}

function withoutTab(root: LayoutNode, docId: string): LayoutNode {
  return mapGroups(root, (group) => {
    const index = group.tabs.indexOf(docId);
    if (index === -1) return group;
    const tabs = group.tabs.filter((tab) => tab !== docId);
    const active =
      group.active === docId ? (tabs[Math.min(index, tabs.length - 1)] ?? null) : group.active;
    return { ...group, tabs, active };
  });
}

function mapGroups(node: LayoutNode, fn: (group: PaneGroup) => LayoutNode): LayoutNode {
  if (node.type === 'group') return fn(node);
  return { ...node, children: node.children.map((child) => mapGroups(child, fn)) };
}

function prune(node: LayoutNode): LayoutNode | null {
  if (node.type === 'group') return node.tabs.length > 0 ? node : null;

  const children: LayoutNode[] = [];
  const sizes: number[] = [];
  node.children.forEach((child, index) => {
    const kept = prune(child);
    if (!kept) return;
    const share = node.sizes[index] ?? 1 / node.children.length;
    if (kept.type === 'split' && kept.direction === node.direction) {
      kept.children.forEach((grandchild, inner) => {
        children.push(grandchild);
        sizes.push(share * kept.sizes[inner]);
      });
    } else {
      children.push(kept);
      sizes.push(share);
    }
  });

  if (children.length === 0) return null;
  if (children.length === 1) return children[0];
  return { ...node, children, sizes: scale(sizes) };
}

function scale(sizes: readonly number[]): number[] {
  const total = sizes.reduce((sum, size) => sum + size, 0) || 1;
  return sizes.map((size) => size / total);
}
