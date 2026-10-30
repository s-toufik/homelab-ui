import {
  addTab,
  allGroups,
  closeTab,
  createGroup,
  groupOf,
  moveTab,
  resizeSplit,
  type LayoutNode,
  type PaneSplit,
} from './pane-layout';

function ids(): () => string {
  let next = 0;
  return () => `n${++next}`;
}

describe('pane layout', () => {
  it('adds a tab and makes it active', () => {
    const layout = addTab(createGroup('g', ['a']), 'g', 'b');

    expect(layout).toEqual({ type: 'group', id: 'g', tabs: ['a', 'b'], active: 'b' });
  });

  it('splits a group when a tab is dropped on its right edge', () => {
    const layout = moveTab(createGroup('g', ['a', 'b']), 'b', 'g', 'right', ids()) as PaneSplit;

    expect(layout.type).toBe('split');
    expect(layout.direction).toBe('row');
    expect(layout.sizes).toEqual([0.5, 0.5]);
    expect(allGroups(layout).map((group) => group.tabs)).toEqual([['a'], ['b']]);
  });

  it('stacks groups vertically when dropped on the top edge', () => {
    const layout = moveTab(createGroup('g', ['a', 'b']), 'b', 'g', 'top', ids()) as PaneSplit;

    expect(layout.direction).toBe('column');
    expect(allGroups(layout).map((group) => group.tabs)).toEqual([['b'], ['a']]);
  });

  it('flattens a same-direction split instead of nesting it', () => {
    const next = ids();
    let layout: LayoutNode = moveTab(createGroup('g', ['a', 'b', 'c']), 'b', 'g', 'right', next);
    layout = moveTab(layout, 'c', groupOf(layout, 'b')!.id, 'right', next);

    const split = layout as PaneSplit;
    expect(split.children.length).toBe(3);
    expect(split.sizes).toEqual([0.5, 0.25, 0.25]);
  });

  it('removes an emptied pane and collapses the split', () => {
    const next = ids();
    let layout: LayoutNode = moveTab(createGroup('g', ['a', 'b']), 'b', 'g', 'right', next);
    layout = moveTab(layout, 'b', 'g', 'center', next);

    expect(layout).toEqual({ type: 'group', id: 'g', tabs: ['a', 'b'], active: 'b' });
  });

  it('keeps a single empty pane when the last tab closes', () => {
    const layout = closeTab(createGroup('g', ['a']), 'a');

    expect(layout).toEqual({ type: 'group', id: 'g', tabs: [], active: null });
  });

  it('activates the neighbour tab when the active tab closes', () => {
    const layout = closeTab({ ...createGroup('g', ['a', 'b', 'c']), active: 'b' }, 'b');

    expect(layout).toEqual({ type: 'group', id: 'g', tabs: ['a', 'c'], active: 'c' });
  });

  it('ignores dropping the only tab of a pane on its own edge', () => {
    const layout = createGroup('g', ['a']);

    expect(moveTab(layout, 'a', 'g', 'left', ids())).toEqual(layout);
  });

  it('resizes a split and keeps sizes normalised', () => {
    const layout = moveTab(createGroup('g', ['a', 'b']), 'b', 'g', 'right', ids()) as PaneSplit;

    const resized = resizeSplit(layout, layout.id, [3, 1]) as PaneSplit;

    expect(resized.sizes).toEqual([0.75, 0.25]);
  });
});
