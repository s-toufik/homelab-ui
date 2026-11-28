import { tourScope, type TourTiming } from './idle-tour';

const timing: TourTiming = { start: 1000, show: 300, rest: 100 };
const scopes = ['assistant', 'observe', 'home'];

describe('tourScope', () => {
  it('waits before starting', () => {
    expect(tourScope(999, scopes, timing)).toBeNull();
  });

  it('shows each scope in turn with a rest between them', () => {
    expect(tourScope(1000, scopes, timing)).toBe('assistant');
    expect(tourScope(1299, scopes, timing)).toBe('assistant');
    expect(tourScope(1300, scopes, timing)).toBeNull();
    expect(tourScope(1400, scopes, timing)).toBe('observe');
    expect(tourScope(1800, scopes, timing)).toBe('home');
  });

  it('starts again from the first scope once round', () => {
    expect(tourScope(2200, scopes, timing)).toBe('assistant');
  });

  it('has nothing to show without scopes', () => {
    expect(tourScope(5000, [], timing)).toBeNull();
  });
});
