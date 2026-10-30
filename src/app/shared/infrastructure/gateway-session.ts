import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { API_ROUTING } from './homelab-server';

export interface SignedInUser {
  readonly username: string;
  readonly email: string | null;
}

interface UserInfoResponse {
  readonly user?: string;
  readonly email?: string;
  readonly preferredUsername?: string;
}

const USERINFO_PATH = '/oauth2/userinfo';
const TIMEOUT_MS = 4000;
const CHECK_INTERVAL_MS = 60_000;

@Injectable({ providedIn: 'root' })
export class GatewaySession {
  private readonly destroyRef = inject(DestroyRef);
  readonly enabled = inject(API_ROUTING) === 'gateway';
  readonly user = signal<SignedInUser | null>(null);
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

    const body = (await response.json().catch(() => ({}))) as UserInfoResponse;
    const username = body.preferredUsername || body.user;
    if (username) this.user.set({ username, email: body.email ?? null });
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

  signIn(): void {
    location.assign(`/oauth2/sign_in?rd=${encodeURIComponent(location.href)}`);
  }
}
