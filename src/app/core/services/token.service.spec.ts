import { createServiceFactory, SpectatorService } from '@ngneat/spectator/jest';
import { TokenService } from './token.service';

describe(TokenService.name, () => {
  let spectator: SpectatorService<TokenService>;

  const createService = createServiceFactory(TokenService);

  beforeEach(() => {
    localStorage.clear();
    spectator = createService();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getToken', () => {
    it('should return null when no token is stored', () => {
      expect(spectator.service.getToken()).toBeNull();
    });

    it('should return the stored token', () => {
      localStorage.setItem('auth_token', 'my-token');
      expect(spectator.service.getToken()).toBe('my-token');
    });
  });

  describe('getRefreshToken', () => {
    it('should return null when no refresh token is stored', () => {
      expect(spectator.service.getRefreshToken()).toBeNull();
    });

    it('should return the stored refresh token', () => {
      localStorage.setItem('auth_refresh_token', 'my-refresh-token');
      expect(spectator.service.getRefreshToken()).toBe('my-refresh-token');
    });
  });

  describe('setTokens', () => {
    it('should store both tokens in localStorage', () => {
      spectator.service.setTokens('tok', 'ref');
      expect(localStorage.getItem('auth_token')).toBe('tok');
      expect(localStorage.getItem('auth_refresh_token')).toBe('ref');
    });
  });

  describe('clearTokens', () => {
    it('should remove both tokens from localStorage', () => {
      localStorage.setItem('auth_token', 'tok');
      localStorage.setItem('auth_refresh_token', 'ref');
      spectator.service.clearTokens();
      expect(localStorage.getItem('auth_token')).toBeNull();
      expect(localStorage.getItem('auth_refresh_token')).toBeNull();
    });
  });

  describe('hasToken', () => {
    it('should return false when no token is stored', () => {
      expect(spectator.service.hasToken()).toBe(false);
    });

    it('should return true when a token is stored', () => {
      localStorage.setItem('auth_token', 'tok');
      expect(spectator.service.hasToken()).toBe(true);
    });
  });
});
