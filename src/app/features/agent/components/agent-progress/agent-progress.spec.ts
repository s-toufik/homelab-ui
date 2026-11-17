import { TestBed, type ComponentFixture } from '@angular/core/testing';
import type { ProgressNode } from '../../domain/agent-progress';
import { AgentProgress } from './agent-progress';

const ERROR =
  'Error executing tool file_writer: the path /workspace/hello.py is outside the folder this agent may write to';

const coding: ProgressNode = {
  agent: 'coding',
  state: 'needs_input',
  task: 'Create Hello World programs in Python and JavaScript, one file each, and say where they are',
  steps: [
    { number: 1, action: 'Write hello.py', tool: 'file_writer', state: 'done' },
    { number: 2, action: 'Write hello.js', tool: 'file_writer', state: 'todo' },
  ],
  tools: [
    { callId: 'c1', name: 'file_writer', state: 'failed', detail: ERROR },
    { callId: 'c2', name: 'file_writer', state: 'done', detail: '{"path":"hello.py"}' },
  ],
  agents: [],
};

function render(node: ProgressNode): ComponentFixture<AgentProgress> {
  const fixture = TestBed.createComponent(AgentProgress);
  fixture.componentRef.setInput('node', node);
  fixture.detectChanges();
  return fixture;
}

describe('AgentProgress', () => {
  it('opens a window with the whole task, the plan and every tool call in full', () => {
    const fixture = render(coding);
    const element: HTMLElement = fixture.nativeElement;
    expect(element.querySelector('.details__panel')).toBeNull();

    element.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!.click();
    fixture.detectChanges();

    const panel = element.querySelector('.details__panel')!;
    expect(element.querySelector('dialog')!.open).toBe(true);
    expect(panel.querySelector('.details__task')?.textContent).toContain('say where they are');
    expect(panel.textContent).toContain('Plan · 1 of 2 steps');
    expect(panel.textContent).toContain('Tool calls · 2 · 1 failed');
    expect(panel.querySelector('.tools--full .tool__detail')?.textContent?.trim()).toBe(ERROR);
  });

  it('closes the window with its close button', () => {
    const fixture = render(coding);
    const element: HTMLElement = fixture.nativeElement;
    element.querySelector<HTMLButtonElement>('[aria-haspopup="dialog"]')!.click();
    fixture.detectChanges();

    element.querySelector<HTMLButtonElement>('.details [aria-label="Close"]')!.click();
    fixture.detectChanges();

    expect(element.querySelector('dialog')!.open).toBe(false);
    expect(element.querySelector('.details__panel')).toBeNull();
  });

  it('keeps folding the card from the chevron and the card itself', () => {
    const fixture = render(coding);
    const element: HTMLElement = fixture.nativeElement;
    const toggle = element.querySelector<HTMLButtonElement>('.card__toggle')!;
    expect(toggle.getAttribute('aria-expanded')).toBe('false');

    toggle.click();
    fixture.detectChanges();

    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(element.querySelector('.card__body .steps')).toBeTruthy();
  });
});
