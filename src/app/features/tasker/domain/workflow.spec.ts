import { blockTitle, defaultConfig } from './workflow';

describe('blockTitle', () => {
  it('shows the block name, else the group name, else the kind', () => {
    expect(blockTitle({ label: 'Fetch pods', config: defaultConfig('http') })).toBe('Fetch pods');
    expect(blockTitle({ label: '  ', config: defaultConfig('http') })).toBe('HTTP request');
    expect(
      blockTitle({ config: { ...defaultConfig('group'), name: 'Backup report' } as never }),
    ).toBe('Backup report');
  });
});
