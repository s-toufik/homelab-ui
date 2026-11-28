import { spreadRows } from './scene-kit';

describe('spreadRows', () => {
  it('leaves names that do not touch where they are', () => {
    expect(
      spreadRows(
        [
          [10, 20],
          [60, 20],
        ],
        4,
        0,
        500,
      ),
    ).toEqual([10, 60]);
  });

  it('spreads a crowded run evenly round the rows it labels', () => {
    expect(
      spreadRows(
        [
          [100, 20],
          [104, 20],
          [108, 20],
        ],
        4,
        0,
        500,
      ),
    ).toEqual([80, 104, 128]);
  });

  it('keeps the column inside the screen', () => {
    expect(
      spreadRows(
        [
          [480, 20],
          [484, 20],
        ],
        4,
        0,
        500,
      ),
    ).toEqual([456, 480]);
  });
});
