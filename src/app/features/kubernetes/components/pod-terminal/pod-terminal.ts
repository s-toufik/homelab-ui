import {
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  signal,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { FitAddon } from '@xterm/addon-fit';
import { Terminal } from '@xterm/xterm';
import {
  ERROR,
  EXEC_PROTOCOLS,
  STDERR,
  STDIN,
  STDOUT,
  frame,
  readFrame,
  resizeFrame,
} from '../../infrastructure/api/exec-channel';
import { KubeApiService } from '../../infrastructure/api/kube-api.service';

@Component({
  selector: 'app-pod-terminal',
  template: `
    <p class="pod-terminal__state hl-muted">{{ state() }}</p>
    <div #screen class="pod-terminal__screen"></div>
  `,
  styleUrl: './pod-terminal.scss',
  encapsulation: ViewEncapsulation.None,
})
export class PodTerminal {
  readonly namespace = input.required<string>();
  readonly pod = input.required<string>();
  readonly container = input.required<string>();

  private readonly api = inject(KubeApiService);
  private readonly screen = viewChild.required<ElementRef<HTMLDivElement>>('screen');
  protected readonly state = signal('Connecting…');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const styles = getComputedStyle(document.documentElement);
      const terminal = new Terminal({
        cursorBlink: true,
        fontFamily: styles.getPropertyValue('--font-mono'),
        fontSize: 13,
        theme: {
          background: styles.getPropertyValue('--code-surface').trim() || '#000',
          foreground: styles.getPropertyValue('--text').trim() || '#fff',
          cursor: styles.getPropertyValue('--accent').trim() || '#fff',
        },
      });
      const fit = new FitAddon();
      terminal.loadAddon(fit);
      terminal.open(this.screen().nativeElement);
      fit.fit();

      const socket = new WebSocket(
        this.api.execUrl(this.namespace(), this.pod(), this.container()),
        EXEC_PROTOCOLS,
      );
      socket.binaryType = 'arraybuffer';
      const decoder = new TextDecoder();
      const send = (data: Uint8Array) => {
        if (socket.readyState === WebSocket.OPEN) socket.send(data);
      };

      socket.onopen = () => {
        this.state.set(`Connected to ${this.pod()} / ${this.container()}`);
        send(resizeFrame(terminal.cols, terminal.rows));
        terminal.focus();
      };
      socket.onmessage = (event) => {
        const { channel, bytes } = readFrame(event.data as ArrayBuffer);
        if (channel === STDOUT || channel === STDERR)
          terminal.write(decoder.decode(bytes, { stream: true }));
        if (channel === ERROR && bytes.length) {
          const status = decoder.decode(bytes);
          if (!status.includes('"Success"')) terminal.write(`\r\n\x1b[31m${status}\x1b[0m\r\n`);
        }
      };
      socket.onclose = () => this.state.set('Disconnected. Open the tab again to reconnect.');
      socket.onerror = () =>
        this.state.set(
          'Could not connect: the shell needs the admin role and a running container.',
        );

      const input = terminal.onData((data) => send(frame(STDIN, data)));
      const resize = terminal.onResize(({ cols, rows }) => send(resizeFrame(cols, rows)));
      const observer = new ResizeObserver(() => fit.fit());
      observer.observe(this.screen().nativeElement);

      destroyRef.onDestroy(() => {
        observer.disconnect();
        input.dispose();
        resize.dispose();
        socket.close();
        terminal.dispose();
      });
    });
  }
}
