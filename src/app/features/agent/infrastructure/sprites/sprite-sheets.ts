import { Injectable } from '@angular/core';
import type { AgentMood } from '../../domain/agent-activity';

export const SPRITE_ROWS: readonly AgentMood[] = ['idle', 'working', 'waiting', 'trouble'];

export interface SpriteSheet {
  readonly image: CanvasImageSource;
  readonly frameWidth: number;
  readonly frameHeight: number;
  readonly frames: number;
}

export function sheetOf(
  image: CanvasImageSource,
  width: number,
  height: number,
): SpriteSheet | null {
  const frameHeight = Math.floor(height / SPRITE_ROWS.length);
  const frameWidth = Math.round(frameHeight * 1.5);
  if (frameHeight < 1 || frameWidth > width) return null;
  return { image, frameWidth, frameHeight, frames: Math.max(1, Math.floor(width / frameWidth)) };
}

export function frameAt(
  sheet: SpriteSheet,
  mood: AgentMood,
  frame: number,
): { x: number; y: number } {
  return {
    x: (frame % sheet.frames) * sheet.frameWidth,
    y: SPRITE_ROWS.indexOf(mood) * sheet.frameHeight,
  };
}

@Injectable({ providedIn: 'root' })
export class SpriteSheets {
  private readonly sheets = new Map<string, Promise<SpriteSheet | null>>();

  load(agent: string): Promise<SpriteSheet | null> {
    let sheet = this.sheets.get(agent);
    if (!sheet) {
      sheet = new Promise((resolve) => {
        if (typeof Image !== 'function') return resolve(null);
        const image = new Image();
        image.onload = () => resolve(sheetOf(image, image.naturalWidth, image.naturalHeight));
        image.onerror = () => resolve(null);
        image.src = `sprites/${encodeURIComponent(agent)}.png`;
      });
      this.sheets.set(agent, sheet);
    }
    return sheet;
  }
}
