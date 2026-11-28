import { InjectionToken } from '@angular/core';
import type { CenterStyleId } from '../../domain/center-style';
import type { Hue } from '../../domain/homelab-feature';

/* What a 3D Center style draws: the Center's constellations as scopes, each with its pages as parts. */
export interface ScenePart {
  readonly id: string;
  readonly label: string;
  readonly color: string;
}

export interface SceneScope {
  readonly id: string;
  readonly name: string;
  readonly color: string;
  readonly parts: readonly ScenePart[];
}

/* The scope to bring forward, and the part picked in it, if any. */
export interface SceneTarget {
  readonly scope: string | null;
  readonly part: string | null;
}

/* How a scene talks back to the page. */
export interface SceneEvents {
  pick(partId: string | null): void;
  focus(scopeId: string): void;
  hover(partId: string | null): void;
  interact(): void;
  isWaiting(partId: string): boolean;
}

export interface SceneOptions {
  readonly reducedMotion: boolean;
}

export interface CenterScene {
  show(target: SceneTarget): void;
  idle(on: boolean): void;
  zoom(factor: number): void;
  /* Turns the view as dragging left and up by these angles would. */
  turn(left: number, up: number): void;
  reset(): void;
  dispose(): void;
}

export type MountScene = (
  host: HTMLElement,
  scopes: readonly SceneScope[],
  events: SceneEvents,
  options: SceneOptions,
) => CenterScene;

export type SceneStyle = Exclude<CenterStyleId, 'sky'>;
export type SceneLoaders = Readonly<Record<SceneStyle, () => Promise<MountScene>>>;

/* Each style is its own chunk, so three.js only downloads once a 3D style is in use. */
export const CENTER_SCENES = new InjectionToken<SceneLoaders>('CENTER_SCENES', {
  factory: () => ({
    ferrofluid: () => import('./ferrofluid.scene').then((m) => m.mountFerrofluid),
    atlas: () => import('./atlas.scene').then((m) => m.mountAtlas),
    starmap: () => import('./starmap.scene').then((m) => m.mountStarmap),
    contour: () => import('./contour.scene').then((m) => m.mountContour),
  }),
});

/* The hues as they read on a night background, whatever the page's theme: the scenes are always at night. */
export const NIGHT_HUES: Readonly<Record<Hue, string>> = {
  orange: '#f0883e',
  teal: '#39c5bb',
  indigo: '#8c9eff',
  purple: '#bc8cff',
  blue: '#58a6ff',
  green: '#56d364',
  rose: '#f778ba',
  amber: '#e3b341',
  slate: '#a8b3c2',
};
