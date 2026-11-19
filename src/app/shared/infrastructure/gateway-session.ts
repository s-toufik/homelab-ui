import { DestroyRef, Injectable, InjectionToken, computed, inject, signal } from '@angular/core';
import { API_ROUTING } from './homelab-server';

export interface SignedInUser {
  readonly username: string;
  readonly email: string | null;
}

interface UserInfoResponse {
  readonly user?: string;
  readonly email?: string;
  readonly preferredUsername?: string;
  readonly groups?: readonly string[];
}

export const PREVIEW_GROUPS_KEY = 'homelab-ui.preview-groups';

export const PREVIEW_GROUPS = new InjectionToken<readonly string[] | null>('PREVIEW_GROUPS', {
  factory: () => {
    try {
      const saved = JSON.parse(globalThis.localStorage?.getItem(PREVIEW_GROUPS_KEY) ?? 'null');
      return Array.isArray(saved) ? saved.filter((group) => typeof group === 'string') : null;
    } catch {
      return null;
    }
  },
});

const USERINFO_PATH = '/oauth2/userinfo';
const ADMIN_GROUP = 'role:admin';
const TIMEOUT_MS = 4000;
const CHECK_INTERVAL_MS = 60_000;
const SIGN_IN_RETRY_KEY = 'homelab-ui.signin-attempted-at';
const SIGN_IN_RETRY_WINDOW_MS = 10_000;

@Injectable({ providedIn: 'root' })
export class GatewaySession {
  private readonly destroyRef = inject(DestroyRef);
  readonly enabled = inject(API_ROUTING) === 'gateway';
  private readonly preview = this.enabled ? null : inject(PREVIEW_GROUPS);
  readonly user = signal<SignedInUser | null>(
    this.preview ? { username: 'preview', email: null } : null,
  );
  readonly groups = signal<readonly string[]>(this.preview ?? []);
  readonly isAdmin = computed(
    () => (!this.enabled && !this.preview) || this.groups().includes(ADMIN_GROUP),
  );
  readonly signOutUrl = '/oauth2/sign_out?rd=%2F';

  async load(): Promise<void> {
    if (!this.enabled) return;
    let response: Response;
    try {
      response = await fetch(USERINFO_PATH, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch {
      return;
    }

    if (response.status === 401) {
      this.signIn();
      return;
    }
    if (!response.ok) return;

    sessionStorage.removeItem(SIGN_IN_RETRY_KEY);
    const body = (await response.json().catch(() => ({}))) as UserInfoResponse;
    const username = body.preferredUsername || body.user;
    if (username) this.user.set({ username, email: body.email ?? null });
    this.groups.set(body.groups ?? []);
  }

  watch(): void {
    if (!this.enabled) return;
    const check = () => void this.load();
    const onVisible = () => {
      if (document.visibilityState === 'visible') check();
    };
    const timer = setInterval(check, CHECK_INTERVAL_MS);
    document.addEventListener('visibilitychange', onVisible);
    this.destroyRef.onDestroy(() => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    });
  }

  signIn(): boolean {
    const attemptedAt = Number(sessionStorage.getItem(SIGN_IN_RETRY_KEY) ?? 0);
    if (Date.now() - attemptedAt < SIGN_IN_RETRY_WINDOW_MS) return false;
    sessionStorage.setItem(SIGN_IN_RETRY_KEY, String(Date.now()));
    location.assign(`/oauth2/sign_in?rd=${encodeURIComponent(location.href)}`);
    return true;
  }
}
