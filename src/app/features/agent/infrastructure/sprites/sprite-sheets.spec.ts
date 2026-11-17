import { frameAt, sheetOf } from './sprite-sheets';

describe('sprite sheets', () => {
  const image = {} as CanvasImageSource;

  it('reads four mood rows of 3:2 frames from the image size', () => {
    const sheet = sheetOf(image, 576, 256)!;

    expect(sheet).toMatchObject({ frameWidth: 96, frameHeight: 64, frames: 6 });
    expect(frameAt(sheet, 'working', 8)).toEqual({ x: 192, y: 64 });
    expect(frameAt(sheet, 'trouble', 0)).toEqual({ x: 0, y: 192 });
  });

  it('refuses an image too narrow for one frame', () => {
    expect(sheetOf(image, 50, 256)).toBeNull();
  });
});
