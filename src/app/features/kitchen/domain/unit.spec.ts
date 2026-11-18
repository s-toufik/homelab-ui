import { toGrams } from './unit';

describe('toGrams', () => {
  it('converts every European unit to grams', () => {
    expect(toGrams(2, 'kg')).toBe(2000);
    expect(toGrams(3, 'càs')).toBe(45);
    expect(toGrams(1, 'càc')).toBe(5);
    expect(toGrams(1, 'pincée')).toBe(0.5);
    expect(toGrams(2, 'pièce')).toBe(100);
    expect(toGrams(1, 'cl')).toBe(10);
  });
});
