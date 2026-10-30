export interface ServiceAddressOverride {
  readonly port?: number | null;
  readonly subpath?: string | null;
}

export type ServiceOverrides = Readonly<Record<string, ServiceAddressOverride>>;

export interface ConnectionSettings {
  readonly host: string | null;
  readonly overrides: ServiceOverrides;
}

export const DEFAULT_CONNECTION_SETTINGS: ConnectionSettings = { host: null, overrides: {} };
