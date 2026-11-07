import { Injectable, inject } from '@angular/core';
import { GatewayApi } from '@shared/infrastructure/gateway-api';
import { HomelabServer } from '@shared/infrastructure/homelab-server';
import type { Credential, Device, Profile } from '../../domain/account';
import ACCOUNT from '../account-api.json';

interface ProfileResponse {
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  emailVerified?: boolean;
  [key: string]: unknown;
}

interface SessionResponse {
  id: string;
  ipAddress?: string;
  started?: number;
  lastAccess?: number;
  expires?: number;
  current?: boolean;
  clients?: { clientId: string; clientName?: string }[];
}

interface DeviceResponse {
  id?: string;
  os?: string;
  osVersion?: string;
  browser?: string;
  device?: string;
  mobile?: boolean;
  current?: boolean;
  lastAccess?: number;
  sessions?: SessionResponse[];
}

interface CredentialResponse {
  type: string;
  displayName?: string;
  userCredentialMetadatas?: { credential?: { createdDate?: number; userLabel?: string } }[];
}

export function toDevices(body: DeviceResponse[]): Device[] {
  return body.map((device, index) => ({
    id: device.id ?? `device-${index}`,
    label:
      [device.browser, device.os && `${device.os} ${device.osVersion ?? ''}`.trim(), device.device]
        .filter((part) => part && part !== 'Other' && part !== 'Unknown')
        .join(' · ') || 'Unknown device',
    mobile: !!device.mobile,
    current: !!device.current,
    lastAccess: (device.lastAccess ?? 0) * 1000,
    sessions: (device.sessions ?? []).map((session) => ({
      id: session.id,
      ipAddress: session.ipAddress ?? '',
      started: (session.started ?? 0) * 1000,
      lastAccess: (session.lastAccess ?? 0) * 1000,
      expires: (session.expires ?? 0) * 1000,
      clients: (session.clients ?? []).map((client) => client.clientName || client.clientId),
      current: !!session.current,
    })),
  }));
}

export function toCredentials(body: CredentialResponse[]): Credential[] {
  return body.flatMap((entry) =>
    (entry.userCredentialMetadatas ?? []).map((meta) => ({
      type: entry.type,
      label: meta.credential?.userLabel || entry.displayName || entry.type,
      createdMs: meta.credential?.createdDate ?? null,
    })),
  );
}

@Injectable({ providedIn: 'root' })
export class AccountApiService {
  private readonly api = inject(GatewayApi);
  private readonly server = inject(HomelabServer);

  private url(path: string): string {
    return this.server.api(ACCOUNT, path);
  }

  keycloakUrl(path: string): string {
    return this.server.url(ACCOUNT, path);
  }

  async profile(): Promise<Profile> {
    const body = await this.api.json<ProfileResponse>(this.url('/'));
    return {
      username: body.username ?? '',
      firstName: body.firstName ?? '',
      lastName: body.lastName ?? '',
      email: body.email ?? '',
      emailVerified: !!body.emailVerified,
      raw: body,
    };
  }

  async saveProfile(profile: Profile): Promise<void> {
    const { userProfileMetadata: _metadata, ...fields } = profile.raw;
    await this.api.json(this.url('/'), {
      method: 'POST',
      body: {
        ...fields,
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
      },
    });
  }

  async devices(): Promise<Device[]> {
    return toDevices(await this.api.json<DeviceResponse[]>(this.url('/sessions/devices')));
  }

  async endSession(id: string): Promise<void> {
    await this.api.send(this.url(`/sessions/${encodeURIComponent(id)}`), { method: 'DELETE' });
  }

  async endOtherSessions(): Promise<void> {
    await this.api.send(this.url('/sessions'), { method: 'DELETE' });
  }

  async credentials(): Promise<Credential[]> {
    return toCredentials(await this.api.json<CredentialResponse[]>(this.url('/credentials')));
  }
}
