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
const SIGN_IN_RETRY_WINDOW_MS = 20_000;

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
  /**
   * The session ended while the page was open. The shell then asks before signing in again
   * instead of navigating on its own: an unattended tab parked on the Keycloak form outlives
   * oauth2-proxy's 15-minute CSRF cookie, and the login that finally completes is rejected
   * with a 403 at /oauth2/callback.
   */
  readonly expired = signal(false);

  /** Start-up check: the page was just opened, so sending the browser to sign in is expected. */
  async load(): Promise<void> {
    if ((await this.check()) !== 'signed-out') return;
    if (!this.signInAttemptedRecently()) this.signIn();
    else this.expired.set(true);
  }

  /** Re-checks the session after something hinted it may have ended. Never navigates. */
  async verify(): Promise<void> {
    if ((await this.check()) === 'signed-out') this.expired.set(true);
  }

  watch(): void {
    if (!this.enabled) return;
    const check = () => void this.verify();
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

  signIn(): void {
    sessionStorage.setItem(SIGN_IN_RETRY_KEY, String(Date.now()));
    location.assign(`/oauth2/sign_in?rd=${encodeURIComponent(location.href)}`);
  }

  private signInAttemptedRecently(): boolean {
    const attemptedAt = Number(sessionStorage.getItem(SIGN_IN_RETRY_KEY) ?? 0);
    return Date.now() - attemptedAt < SIGN_IN_RETRY_WINDOW_MS;
  }

  private async check(): Promise<'signed-in' | 'signed-out' | 'unknown'> {
    if (!this.enabled) return 'unknown';
    let response: Response;
    try {
      response = await fetch(USERINFO_PATH, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    } catch {
      return 'unknown';
    }

    if (response.status === 401) return 'signed-out';
    if (!response.ok) return 'unknown';

    const body = (await response.json().catch(() => ({}))) as UserInfoResponse;
    const username = body.preferredUsername || body.user;
    if (username) this.user.set({ username, email: body.email ?? null });
    this.groups.set(body.groups ?? []);
    this.expired.set(false);
    return 'signed-in';
  }
}
