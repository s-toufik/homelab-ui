import { STDIN, frame, readFrame, resizeFrame } from './exec-channel';

describe('exec channel frames', () => {
  it('prefixes the channel byte and reads it back', () => {
    const message = frame(STDIN, 'ls\r');
    expect(Array.from(message)).toEqual([0, 108, 115, 13]);
    const read = readFrame(message.buffer as ArrayBuffer);
    expect(read.channel).toBe(0);
    expect(new TextDecoder().decode(read.bytes)).toBe('ls\r');
  });

  it('sends the terminal size as JSON on channel 4', () => {
    const message = resizeFrame(120, 40);
    expect(message[0]).toBe(4);
    expect(new TextDecoder().decode(message.subarray(1))).toBe('{"Width":120,"Height":40}');
  });
});
