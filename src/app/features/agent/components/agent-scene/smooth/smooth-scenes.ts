import type { AgentMood } from '../../../domain/agent-activity';
import { H, W, type Ctx, type SmoothScene } from './kit';

type Scenes = Readonly<Record<string, SmoothScene>>;

const LOADERS = {
  neural: async () => (await import('./neural')).NEURAL,
  sylvan: async () => (await import('./sylvan')).SYLVAN,
  deepforge: async () => (await import('./deepforge')).DEEPFORGE,
} as const satisfies Record<string, () => Promise<Scenes>>;

export type SmoothCast = keyof typeof LOADERS;
export const SMOOTH_CASTS = Object.keys(LOADERS) as SmoothCast[];
export const SMOOTH_SIZE = { width: W, height: H } as const;

const loaded = new Map<SmoothCast, Scenes>();
const loading = new Map<SmoothCast, Promise<Scenes>>();

export function isSmoothCast(cast: string): cast is SmoothCast {
  return cast in LOADERS;
}

export function loadSmoothCast(cast: SmoothCast): Promise<Scenes> {
  const ready = loaded.get(cast);
  if (ready) return Promise.resolve(ready);
  let pending = loading.get(cast);
  if (!pending) {
    pending = LOADERS[cast]().then((scenes) => {
      loaded.set(cast, scenes);
      return scenes;
    });
    loading.set(cast, pending);
  }
  return pending;
}

export function smoothScenes(cast: SmoothCast): Scenes | undefined {
  return loaded.get(cast);
}

export function drawSmooth(
  g: Ctx,
  agent: string,
  mood: AgentMood,
  seconds: number,
  cast: SmoothCast,
): boolean {
  const scenes = loaded.get(cast);
  const scene = scenes?.[agent] ?? scenes?.['assistant'];
  if (!scene) return false;
  scene(g, seconds, mood);
  return true;
}
