import { InjectionToken } from '@angular/core';
import type { CenterStyleId } from '../domain/center-style';

export interface CenterAccount {
  read(): Promise<CenterStyleId | null>;
  write(style: CenterStyleId): Promise<void>;
}

export const CENTER_ACCOUNT = new InjectionToken<CenterAccount>('CENTER_ACCOUNT');
