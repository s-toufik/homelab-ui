import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';

/**
 * Renders markdown to HTML. Bind the result with plain [innerHTML] (never
 * DomSanitizer.bypassSecurityTrustHtml) so Angular's own sanitizer still
 * strips scripts/event handlers from what is, after all, LLM-generated text.
 */
@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  transform(content: string): string {
    return marked.parse(content, { async: false, breaks: true }) as string;
  }
}
