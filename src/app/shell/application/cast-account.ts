import { InjectionToken } from '@angular/core';
import type { CastChoice } from '../domain/agent-cast';

export interface CastAccount {
  read(): Promise<CastChoice | null>;
  write(choice: CastChoice): Promise<void>;
}

export const CAST_ACCOUNT = new InjectionToken<CastAccount>('CAST_ACCOUNT');
