import type { RecentItem } from '../application/assistant-panel';
import { groupByDay } from './drawer';

const NOW = Date.parse('2026-11-16T18:00:00Z');
const HOUR = 3_600_000;

function item(id: string, hoursAgo: number): RecentItem {
  return {
    id,
    label: id,
    hint: 'Kitchen',
    path: ['/assistant', id],
    waiting: false,
    color: 'red',
    updatedAt: NOW - hoursAgo * HOUR,
  };
}

describe('menu conversations', () => {
  it('lists every conversation by day and leaves out empty days', () => {
    const groups = groupByDay([item('a', 1), item('b', 30), item('c', 400), item('d', 2)], NOW);
    expect(groups.map((g) => [g.title, g.items.map((i) => i.id)])).toEqual([
      ['Today', ['a', 'd']],
      ['This week', ['b']],
      ['Earlier', ['c']],
    ]);
    expect(groupByDay([item('a', 1)], NOW).map((g) => g.title)).toEqual(['Today']);
  });
});
