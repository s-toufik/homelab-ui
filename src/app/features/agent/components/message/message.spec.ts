import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { ChatMessage } from '../../domain/chat-message';
import { Message } from './message';

function render(message: ChatMessage): ComponentFixture<Message> {
  const fixture = TestBed.createComponent(Message);
  fixture.componentRef.setInput('message', message);
  fixture.detectChanges();
  return fixture;
}

const answer: ChatMessage = {
  id: 'a1',
  role: 'assistant',
  content: 'There are 42 rows.',
  streaming: false,
  metadata: {
    elapsed_time: '1m 5s',
    input_tokens: '3412',
    output_tokens: '845',
    model: 'stub-model',
    some_future_field: 'still listed',
  },
};

describe('Message', () => {
  it('puts the copy button and the time and tokens under a finished answer', () => {
    const element: HTMLElement = render(answer).nativeElement;

    const footer = element.querySelector('.message__footer')!;
    expect(footer.querySelector('[aria-label="Copy message"]')).toBeTruthy();
    expect(footer.querySelector('.message__usage-text')?.textContent?.trim()).toBe(
      '(1m 5s · ↑ 3.4k · ↓ 845 tokens)',
    );
    expect(element.querySelector('.message__details')).toBeNull();
  });

  it('lists every metadata field, even unknown ones, when the arrow is opened', () => {
    const fixture = render(answer);
    const element: HTMLElement = fixture.nativeElement;
    const arrow = element.querySelector<HTMLButtonElement>('[aria-label="Answer details"]')!;

    arrow.click();
    fixture.detectChanges();

    const details = element.querySelector('.message__details')!;
    const labels = [...details.querySelectorAll('dt')].map((dt) => dt.textContent?.trim());
    expect(labels).toEqual([
      'Elapsed time',
      'Input tokens',
      'Output tokens',
      'Model',
      'Some future field',
    ]);
    expect(details.textContent).toContain('still listed');
    expect(arrow.getAttribute('aria-expanded')).toBe('true');
  });

  it('shows no footer while the answer is still streaming', () => {
    const element: HTMLElement = render({ ...answer, streaming: true }).nativeElement;

    expect(element.querySelector('.message__footer')).toBeNull();
  });

  it('keeps the copy button but no arrow when the agent reported nothing', () => {
    const element: HTMLElement = render({ ...answer, metadata: undefined }).nativeElement;

    expect(element.querySelector('[aria-label="Copy message"]')).toBeTruthy();
    expect(element.querySelector('[aria-label="Answer details"]')).toBeNull();
  });
});
