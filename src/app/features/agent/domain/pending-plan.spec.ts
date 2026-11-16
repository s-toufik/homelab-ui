import type { ChatMessage } from './chat-message';
import { pendingPlan, withoutApprovalPrompt } from './pending-plan';

const PROMPT =
  '\n\n---\nReply **yes** to approve the plan, **Drop plan** to cancel, or specify any required changes.';

function answer(
  content: string,
  outcome = 'awaiting_approval',
  extra: Partial<ChatMessage> = {},
): ChatMessage {
  return {
    id: 'a1',
    role: 'assistant',
    content,
    streaming: false,
    metadata: { outcome },
    ...extra,
  };
}

describe('pending plan', () => {
  it("removes the agent's reply instructions from the plan's text", () => {
    expect(withoutApprovalPrompt(`Here is the plan:\n1. Pick\n2. Buy${PROMPT}`)).toBe(
      'Here is the plan:\n1. Pick\n2. Buy',
    );
    expect(withoutApprovalPrompt('No plan here.')).toBe('No plan here.');
  });

  it('reads the intro and the steps of the last answer when it waits for approval', () => {
    const plan = pendingPlan([
      { id: 'u1', role: 'user', content: 'Plan dinners', streaming: false },
      answer(
        'Easy, for four people:\n\n1. **Pick** five dinners\n2. Work out the quantities\n- Write the list',
      ),
    ]);
    expect(plan).toEqual({
      messageId: 'a1',
      intro: 'Easy, for four people:',
      steps: ['Pick five dinners', 'Work out the quantities', 'Write the list'],
    });
  });

  it('has no plan once answered, while streaming, or after an error', () => {
    expect(pendingPlan([answer('Done.', 'answered')])).toBeNull();
    expect(pendingPlan([answer('1. Step', 'awaiting_approval', { streaming: true })])).toBeNull();
    expect(pendingPlan([answer('1. Step', 'awaiting_approval', { error: 'boom' })])).toBeNull();
    expect(
      pendingPlan([
        answer('1. Step'),
        { id: 'u2', role: 'user', content: 'yes', streaming: false },
      ]),
    ).toBeNull();
  });
});
