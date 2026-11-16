import { briefing, dateLine, displayName, greeting } from './briefing';

describe('the Today briefing', () => {
  it('names the day, and greets a person by the first part of their username', () => {
    const evening = new Date(2026, 10, 15, 19, 0);
    expect(dateLine(evening)).toBe('Sunday 15 November');
    expect(greeting(evening, displayName('dora'))).toBe('Good evening, Dora.');
    expect(displayName('jean.dupont')).toBe('Jean');
  });

  it('says what waits, then how the homelab is, then the one thing to look at', () => {
    expect(
      briefing({
        waiting: [{ agent: 'Kitchen' }],
        homelab: { online: 24, total: 24, alerts: 0, warnings: ['Disk 91% full'] },
      }),
    ).toEqual([
      'Kitchen has a plan waiting for you.',
      '24 of 24 apps answer.',
      'One thing to look at: disk 91% full.',
    ]);
    expect(
      briefing({ waiting: [], homelab: { online: 24, total: 24, alerts: 0, warnings: [] } }),
    ).toEqual(['The homelab is healthy: all 24 apps answer and no alert is firing.']);
  });

  it('keeps it to what a family member has: no homelab sentence without the homelab', () => {
    expect(
      briefing({ waiting: [{ agent: 'Kitchen' }, { agent: 'Travel' }], homelab: null }),
    ).toEqual(['2 plans are waiting for you.']);
    expect(briefing({ waiting: [], homelab: null })[0]).toContain('Nothing is waiting');
  });
});
