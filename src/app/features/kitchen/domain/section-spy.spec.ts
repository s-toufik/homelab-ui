import { activeSection } from './section-spy';

describe('activeSection', () => {
  const sections = [
    { id: 'overview', top: -400 },
    { id: 'ingredients', top: 90 },
    { id: 'method', top: 600 },
    { id: 'macros', top: 1100 },
  ];

  it('picks the last section whose top has passed the header line', () => {
    expect(activeSection(sections, 100, false)).toBe('ingredients');
    expect(activeSection(sections, 80, false)).toBe('overview');
  });

  it('falls back to the first section before any has reached the line', () => {
    expect(
      activeSection(
        [
          { id: 'a', top: 200 },
          { id: 'b', top: 500 },
        ],
        100,
        false,
      ),
    ).toBe('a');
  });

  it('orders sections by position, not by the order given', () => {
    expect(activeSection([...sections].reverse(), 700, false)).toBe('method');
  });

  it('lights up the last section once the page cannot scroll further', () => {
    expect(activeSection(sections, 100, true)).toBe('macros');
  });

  it('returns null without sections', () => {
    expect(activeSection([], 100, false)).toBeNull();
  });
});
