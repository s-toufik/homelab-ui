import { InjectionToken } from '@angular/core';
import type { CanvasEngine } from '../../domain/canvas-engine';

export const CANVAS_ENGINE = new InjectionToken<() => CanvasEngine | Promise<CanvasEngine>>(
  'CANVAS_ENGINE',
);
