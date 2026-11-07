export const EXEC_PROTOCOLS = ['v5.channel.k8s.io', 'v4.channel.k8s.io'];

export const STDIN = 0;
export const STDOUT = 1;
export const STDERR = 2;
export const ERROR = 3;
export const RESIZE = 4;

const encoder = new TextEncoder();

export function frame(channel: number, payload: string): Uint8Array {
  const bytes = encoder.encode(payload);
  const message = new Uint8Array(bytes.length + 1);
  message[0] = channel;
  message.set(bytes, 1);
  return message;
}

export function resizeFrame(columns: number, rows: number): Uint8Array {
  return frame(RESIZE, JSON.stringify({ Width: columns, Height: rows }));
}

export function readFrame(data: ArrayBuffer): { channel: number; bytes: Uint8Array } {
  const view = new Uint8Array(data);
  return { channel: view[0], bytes: view.subarray(1) };
}
