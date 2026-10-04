import { Pipe, PipeTransform } from '@angular/core';
import { marked } from 'marked';

@Pipe({ name: 'markdown' })
export class MarkdownPipe implements PipeTransform {
  transform(content: string): string {
    return marked.parse(content, { async: false, breaks: true }) as string;
  }
}
