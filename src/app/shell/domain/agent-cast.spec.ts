import { CASTS, isCastChoice, resolveCast } from './agent-cast';

describe('agent cast', () => {
  it('follows the theme until a cast is chosen, then keeps it for every theme', () => {
    expect(resolveCast('theme', 'wizarding')).toBe('wizarding');
    expect(resolveCast('theme', 'dragon')).toBe('dragon');
    expect(resolveCast('theme', 'navy')).toBe('homelab');
    expect(resolveCast('pocket', 'regency')).toBe('pocket');
    expect(resolveCast('digital', 'navy')).toBe('digital');
  });

  it('accepts only known casts', () => {
    expect(isCastChoice('theme')).toBe(true);
    expect(CASTS.every((cast) => isCastChoice(cast.id))).toBe(true);
    expect(isCastChoice('unknown')).toBe(false);
  });
});
