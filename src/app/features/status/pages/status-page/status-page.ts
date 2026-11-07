import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import { copyText } from '@shared/utils/clipboard';
import { StackStatusStore } from '../../application/stack-status.store';
import {
  connectionFor,
  type ServiceLink,
  type ServiceState,
  type StackService,
} from '../../domain/stack-service';

const REFRESH_EVERY_MS = 30_000;

const STATE_LABEL: Record<ServiceState, string> = {
  checking: 'Checking',
  ready: 'Ready',
  'not-ready': 'Not ready',
  unknown: 'Unknown',
};

@Component({
  selector: 'app-status-page',
  imports: [DatePipe, RouterLink],
  templateUrl: './status-page.html',
  styleUrl: './status-page.scss',
})
export class StatusPage implements OnInit, OnDestroy {
  protected readonly store = inject(StackStatusStore);
  private readonly server = inject(HomelabServer);
  private timer: ReturnType<typeof setInterval> | null = null;

  protected readonly host = this.server.host;
  protected readonly stateLabel = STATE_LABEL;
  protected readonly copied = signal<string | null>(null);

  ngOnInit(): void {
    void this.store.refresh();
    this.timer = setInterval(() => void this.store.refresh(), REFRESH_EVERY_MS);
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  protected state(service: StackService): ServiceState {
    return this.store.states()[service.id] ?? 'checking';
  }

  protected route(link: ServiceLink): string | null {
    return 'route' in link ? link.route : null;
  }

  protected href(link: ServiceLink): string {
    if ('route' in link) return link.route;
    if (link.scheme === 'http') return `http://${this.host}:${link.port}${link.path}`;
    return this.server.url({ port: link.port, subpath: null }, link.path);
  }

  protected connection(service: StackService): string | null {
    return connectionFor(service, this.host);
  }

  protected async copy(service: StackService): Promise<void> {
    const text = this.connection(service);
    if (!text || !(await copyText(text))) return;
    this.copied.set(service.id);
    setTimeout(() => this.copied.set(null), 1500);
  }
}
