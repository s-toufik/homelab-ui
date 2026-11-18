import type { AgentMood } from '../../../domain/agent-activity';
import { SCENES } from '../pixel-scenes';
import type { Ctx } from './kit';
import { SMOOTH_CASTS, drawSmooth, loadSmoothCast, smoothScenes } from './smooth-scenes';

const MOODS: readonly AgentMood[] = ['idle', 'working', 'waiting', 'trouble'];
const AGENTS = Object.keys(SCENES);
const PAINTS = new Set(['fill', 'stroke', 'fillRect', 'fillText', 'drawImage']);

class FakePath {
  constructor(readonly d = '') {}
}

function recorder(): { context: Ctx; log: string[] } {
  const log: string[] = [];
  const gradient = {
    addColorStop: (offset: number, color: string) => log.push(`stop ${offset} ${color}`),
  };
  const target: Record<string, unknown> = {};
  const context = new Proxy(target, {
    get(_, key: string) {
      if (key === 'canvas') return undefined;
      if (key in target) return target[key];
      return (...args: unknown[]) => {
        log.push(`${key} ${JSON.stringify(args, (_k, v) => (v instanceof FakePath ? v.d : v))}`);
        if (key.startsWith('create') && key.endsWith('Gradient')) return gradient;
        return undefined;
      };
    },
    set(_, key: string, value: unknown) {
      target[key] = value;
      log.push(`${key}=${typeof value === 'object' ? 'gradient' : String(value)}`);
      return true;
    },
  });
  return { context: context as unknown as Ctx, log };
}

function draw(
  cast: (typeof SMOOTH_CASTS)[number],
  agent: string,
  mood: AgentMood,
  seconds: number,
): string[] {
  const { context, log } = recorder();
  expect(drawSmooth(context, agent, mood, seconds, cast)).toBe(true);
  return log;
}

describe('smooth scenes', () => {
  const realPath = globalThis.Path2D;

  beforeAll(async () => {
    (globalThis as { Path2D: unknown }).Path2D = FakePath;
    await Promise.all(SMOOTH_CASTS.map((cast) => loadSmoothCast(cast)));
  });

  afterAll(() => {
    (globalThis as { Path2D: unknown }).Path2D = realPath;
  });

  it('gives every smooth cast all seven agents', () => {
    for (const cast of SMOOTH_CASTS)
      expect(Object.keys(smoothScenes(cast) ?? {}).sort()).toEqual([...AGENTS].sort());
  });

  for (const cast of SMOOTH_CASTS) {
    for (const agent of AGENTS) {
      it(`draws ${cast}'s ${agent} in every mood, moving while working`, () => {
        const moods = MOODS.map((mood) => draw(cast, agent, mood, 1.3));
        for (const log of moods)
          expect(log.some((entry) => PAINTS.has(entry.split(' ')[0]))).toBe(true);
        for (let i = 0; i < moods.length; i++)
          for (let j = i + 1; j < moods.length; j++)
            expect(moods[i].join('\n')).not.toEqual(moods[j].join('\n'));
        expect(draw(cast, agent, 'working', 1.3).join('\n')).not.toEqual(
          draw(cast, agent, 'working', 2.1).join('\n'),
        );
      });
    }
  }

  it('gives unknown agents the cast’s Assistant', () => {
    expect(draw('sylvan', 'supervisor', 'working', 1).join('\n')).toEqual(
      draw('sylvan', 'assistant', 'working', 1).join('\n'),
    );
  });
});
