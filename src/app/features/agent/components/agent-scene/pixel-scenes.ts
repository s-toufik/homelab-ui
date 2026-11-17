import type { AgentMood } from '../../domain/agent-activity';
import { HEIGHT, PixelFrame, WIDTH } from './pixel-frame';
import { HOMELAB } from './casts/homelab';
import type { PixelScene } from './casts/kit';

export type { PixelScene } from './casts/kit';

type Scenes = Readonly<Record<string, PixelScene>>;

const LOADERS = {
  homelab: async () => HOMELAB,
  wizarding: async () => (await import('./casts/wizarding')).WIZARDING,
  dragon: async () => (await import('./casts/dragon')).DRAGON,
  demigod: async () => (await import('./casts/demigod')).DEMIGOD,
  regency: async () => (await import('./casts/regency')).REGENCY,
  pocket: async () => (await import('./casts/pocket')).POCKET,
  digital: async () => (await import('./casts/digital')).DIGITAL,
  machines: async () => (await import('./casts/machines')).MACHINES,
} as const satisfies Record<string, () => Promise<Scenes>>;

export type DrawnCast = keyof typeof LOADERS;
export const DRAWN_CASTS = Object.keys(LOADERS) as DrawnCast[];

const loaded = new Map<DrawnCast, Scenes>([['homelab', HOMELAB]]);
const loading = new Map<DrawnCast, Promise<Scenes>>();

export const SCENES = HOMELAB;

export function isDrawnCast(cast: string): cast is DrawnCast {
  return cast in LOADERS;
}

export function loadCast(cast: DrawnCast): Promise<Scenes> {
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

export function castScenes(cast: DrawnCast): Scenes | undefined {
  return loaded.get(cast);
}

export function sceneFor(agent: string, cast: DrawnCast = 'homelab'): PixelScene {
  const scenes = loaded.get(cast) ?? HOMELAB;
  return scenes[agent] ?? scenes['assistant'];
}

export function paint(
  agent: string,
  mood: AgentMood,
  frame: number,
  cast: DrawnCast = 'homelab',
): PixelFrame {
  const p = new PixelFrame();
  sceneFor(agent, cast)(p, frame, mood);
  return p;
}

export const SIZE = { width: WIDTH, height: HEIGHT } as const;
