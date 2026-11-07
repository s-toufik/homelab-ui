import { toCredentials, toDevices } from './account-api.service';

describe('Keycloak account API mapping', () => {
  it('names devices and converts times to milliseconds', () => {
    const devices = toDevices([
      {
        id: 'd1',
        browser: 'Firefox/132',
        os: 'Mac OS X',
        osVersion: '15',
        device: 'Other',
        current: true,
        lastAccess: 100,
        sessions: [
          {
            id: 's1',
            ipAddress: '100.64.0.2',
            started: 50,
            lastAccess: 100,
            expires: 200,
            current: true,
            clients: [{ clientId: 'oauth2-proxy' }],
          },
        ],
      },
    ]);
    expect(devices[0].label).toBe('Firefox/132 · Mac OS X 15');
    expect(devices[0].sessions[0]).toMatchObject({
      started: 50_000,
      clients: ['oauth2-proxy'],
      current: true,
    });
  });

  it('lists each stored credential', () => {
    expect(
      toCredentials([
        {
          type: 'password',
          displayName: 'Password',
          userCredentialMetadatas: [{ credential: { createdDate: 5 } }],
        },
        { type: 'otp', userCredentialMetadatas: [] },
      ]),
    ).toEqual([{ type: 'password', label: 'Password', createdMs: 5 }]);
  });
});
