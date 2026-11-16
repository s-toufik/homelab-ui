import type { ChatMessage } from './chat-message';

export const AWAITING_APPROVAL = 'awaiting_approval';
export const APPROVE_REPLY = 'yes';
export const DROP_REPLY = 'Drop plan';

const APPROVAL_PROMPT = /\n*-{3,}\s*\n+\s*Reply \*\*yes\*\*[\s\S]*$/;
const NUMBERED = /^\s*\d+[.)]\s+(.+)$/;
const BULLET = /^\s*[-*•]\s+(.+)$/;

export interface PendingPlan {
  readonly messageId: string;
  readonly intro: string;
  readonly steps: readonly string[];
}

export function withoutApprovalPrompt(content: string): string {
  return content.replace(APPROVAL_PROMPT, '').trimEnd();
}

export function isAwaitingApproval(message: ChatMessage | undefined): boolean {
  return (
    !!message &&
    message.role === 'assistant' &&
    !message.streaming &&
    !message.error &&
    message.metadata?.['outcome'] === AWAITING_APPROVAL
  );
}

export function pendingPlan(messages: readonly ChatMessage[]): PendingPlan | null {
  const last = messages.at(-1);
  if (!last || !isAwaitingApproval(last)) return null;
  const lines = withoutApprovalPrompt(last.content).split('\n');
  const steps: string[] = [];
  const intro: string[] = [];
  for (const line of lines) {
    const step = NUMBERED.exec(line) ?? BULLET.exec(line);
    if (step) steps.push(step[1].replace(/\*\*/g, '').trim());
    else if (steps.length === 0 && line.trim()) intro.push(line.trim());
  }
  return { messageId: last.id, intro: intro.join(' '), steps };
}
