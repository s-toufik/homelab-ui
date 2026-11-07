import { DecimalPipe } from '@angular/common';
import { Component, ElementRef, afterRenderEffect, inject, viewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { MarkdownPipe } from '@shared/pipes/markdown.pipe';
import { PageHeader } from '@shared/ui/page-header/page-header';
import { ModelsStore } from '../../application/models.store';

@Component({
  selector: 'app-models-page',
  imports: [FormsModule, DecimalPipe, MarkdownPipe, PageHeader],
  templateUrl: './models-page.html',
  styleUrl: './models-page.scss',
})
export class ModelsPage {
  protected readonly store = inject(ModelsStore);
  protected readonly isAdmin = inject(GatewaySession).isAdmin;
  private readonly logView = viewChild<ElementRef<HTMLPreElement>>('logView');

  constructor() {
    void this.store.load();
    void this.store.loadLogs();
    afterRenderEffect(() => {
      this.store.logs();
      const element = this.logView()?.nativeElement;
      if (element) element.scrollTop = element.scrollHeight;
    });
  }
}
