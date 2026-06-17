import { createServiceFactory, mockProvider, SpectatorService } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { LogonService } from '../generated/api/logon.service';
import { AuthApiService } from './auth-api.service';

describe(AuthApiService.name, () => {
  let spectator: SpectatorService<AuthApiService>;

  const createService = createServiceFactory({
    service: AuthApiService,
    providers: [
      mockProvider(LogonService, {
        logon: jest.fn(() => of({ token: 'tok', refreshToken: 'ref' })),
        refreshToken: jest.fn(() => of({ token: 'new-tok', refreshToken: 'new-ref' })),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
  });

  describe('logon', () => {
    it('should delegate to LogonService.logon and return its result', () => {
      const logonService = spectator.inject(LogonService);
      const request = { login: 'user', password: 'pass' };

      let result: unknown;
      spectator.service.logon(request).subscribe((r) => (result = r));

      expect(logonService.logon).toHaveBeenCalledWith(request);
      expect(result).toEqual({ token: 'tok', refreshToken: 'ref' });
    });
  });

  describe('refreshToken', () => {
    it('should delegate to LogonService.refreshToken and return its result', () => {
      const logonService = spectator.inject(LogonService);
      const request = { refreshToken: 'old-ref' };

      let result: unknown;
      spectator.service.refreshToken(request).subscribe((r) => (result = r));

      expect(logonService.refreshToken).toHaveBeenCalledWith(request);
      expect(result).toEqual({ token: 'new-tok', refreshToken: 'new-ref' });
    });
  });
});
