export interface Profile {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  emailVerified: boolean;
  raw: Record<string, unknown>;
}

export interface SignedInSession {
  id: string;
  ipAddress: string;
  started: number;
  lastAccess: number;
  expires: number;
  clients: string[];
  current: boolean;
}

export interface Device {
  id: string;
  label: string;
  mobile: boolean;
  current: boolean;
  lastAccess: number;
  sessions: SignedInSession[];
}

export interface Credential {
  type: string;
  label: string;
  createdMs: number | null;
}
