import { createServiceFactory, mockProvider, SpectatorService, SpyObject } from '@ngneat/spectator/vitest';
import { Router } from '@angular/router';
import { NEVER, of, throwError } from 'rxjs';
import { AuthApiService } from '../../../api/services/auth-api.service';
import { TokenService } from '../../../core/services/token.service';
import { LoginStore } from './login.store';

describe(LoginStore.name, () => {
  let spectator: SpectatorService<InstanceType<typeof LoginStore>>;
  let authApi: SpyObject<AuthApiService>;
  let tokenService: SpyObject<TokenService>;
  let router: SpyObject<Router>;

  const createService = createServiceFactory({
    service: LoginStore,
    providers: [
      mockProvider(AuthApiService, { logon: vi.fn(() => NEVER) }),
      mockProvider(TokenService, { setTokens: vi.fn() }),
      mockProvider(Router, { navigate: vi.fn() }),
    ],
  });

  beforeEach(() => {
    spectator = createService();
    authApi = spectator.inject(AuthApiService) as SpyObject<AuthApiService>;
    tokenService = spectator.inject(TokenService) as SpyObject<TokenService>;
    router = spectator.inject(Router) as SpyObject<Router>;
  });

  it('should have loading as false initially', () => {
    expect(spectator.service.loading()).toBe(false);
  });

  it('should have error as null initially', () => {
    expect(spectator.service.error()).toBeNull();
  });

  describe('login', () => {
    it('should set loading to true while the request is in-flight', () => {
      authApi.logon.mockReturnValueOnce(NEVER);
      spectator.service.login({ login: 'user', password: 'pass' });
      expect(spectator.service.loading()).toBe(true);
    });

    it('should store tokens and navigate to /categories on success', () => {
      authApi.logon.mockReturnValueOnce(of({ token: 'tok', refreshToken: 'ref', user: { displayName: '', timezoneOffset: '' } }));
      spectator.service.login({ login: 'user', password: 'pass' });
      expect(tokenService.setTokens).toHaveBeenCalledWith('tok', 'ref');
      expect(router.navigate).toHaveBeenCalledWith(['/categories']);
      expect(spectator.service.loading()).toBe(false);
    });

    it('should set error message and stop loading on failure', () => {
      authApi.logon.mockReturnValueOnce(throwError(() => new Error('Unauthorized')));
      spectator.service.login({ login: 'user', password: 'wrong' });
      expect(spectator.service.loading()).toBe(false);
      expect(spectator.service.error()).toBe('Invalid login or password');
    });

    it('should clear the previous error on each new login attempt', () => {
      authApi.logon.mockReturnValueOnce(throwError(() => new Error()));
      spectator.service.login({ login: 'user', password: 'wrong' });
      expect(spectator.service.error()).not.toBeNull();

      authApi.logon.mockReturnValueOnce(NEVER);
      spectator.service.login({ login: 'user', password: 'pass' });
      expect(spectator.service.error()).toBeNull();
    });
  });
});
