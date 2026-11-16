import { inject } from '@angular/core';
import { Router, type CanMatchFn } from '@angular/router';
import { AccessStore } from './access.store';

export function requireAccess(access: string): CanMatchFn {
  return () => inject(AccessStore).can(access) || inject(Router).createUrlTree(['/']);
}

export const requireAdmin: CanMatchFn = () =>
  inject(AccessStore).isAdmin() || inject(Router).createUrlTree(['/']);
