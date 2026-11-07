import { DatePipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { GatewaySession } from '@shared/infrastructure/gateway-session';
import { PageHeader } from '@shared/ui/page-header/page-header';
import type { Credential, Device, Profile } from '../../domain/account';
import { AccountApiService } from '../../infrastructure/api/account-api.service';

@Component({
  selector: 'app-account-page',
  imports: [FormsModule, DatePipe, PageHeader],
  templateUrl: './account-page.html',
  styleUrl: './account-page.scss',
})
export class AccountPage {
  private readonly api = inject(AccountApiService);
  protected readonly session = inject(GatewaySession);
  protected readonly profile = signal<Profile | null>(null);
  protected readonly devices = signal<Device[]>([]);
  protected readonly credentials = signal<Credential[]>([]);
  protected readonly error = signal<string | null>(null);
  protected readonly saving = signal(false);
  protected readonly saved = signal(false);
  protected readonly changePasswordUrl = this.api.keycloakUrl(
    `/protocol/openid-connect/auth?${new URLSearchParams({
      client_id: 'account-console',
      redirect_uri: this.api.keycloakUrl('/account/'),
      response_type: 'code',
      scope: 'openid',
      kc_action: 'UPDATE_PASSWORD',
    })}`,
  );

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.error.set(null);
    try {
      const [profile, devices, credentials] = await Promise.all([
        this.api.profile(),
        this.api.devices(),
        this.api.credentials().catch(() => []),
      ]);
      this.profile.set(profile);
      this.devices.set(devices);
      this.credentials.set(credentials);
    } catch (error) {
      this.error.set((error as Error).message);
    }
  }

  protected async save(): Promise<void> {
    const profile = this.profile();
    if (!profile) return;
    this.saving.set(true);
    this.saved.set(false);
    this.error.set(null);
    try {
      await this.api.saveProfile(profile);
      this.saved.set(true);
    } catch (error) {
      this.error.set((error as Error).message);
    } finally {
      this.saving.set(false);
    }
  }

  protected update(field: 'firstName' | 'lastName' | 'email', value: string): void {
    this.profile.update((profile) => (profile ? { ...profile, [field]: value } : profile));
    this.saved.set(false);
  }

  protected async end(sessionId: string): Promise<void> {
    if (!confirm('Sign this session out?')) return;
    await this.run(() => this.api.endSession(sessionId));
  }

  protected async endOthers(): Promise<void> {
    if (!confirm('Sign out every other session of this account?')) return;
    await this.run(() => this.api.endOtherSessions());
  }

  private async run(action: () => Promise<void>): Promise<void> {
    try {
      await action();
      this.devices.set(await this.api.devices());
    } catch (error) {
      this.error.set((error as Error).message);
    }
  }
}
