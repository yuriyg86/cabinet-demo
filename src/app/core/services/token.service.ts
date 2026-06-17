import { Injectable } from '@angular/core';

const tokenKey = 'auth_token';
const refreshTokenKey = 'auth_refresh_token';

@Injectable({ providedIn: 'root' })
export class TokenService {
  getToken(): string | null {
    return localStorage.getItem(tokenKey);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(refreshTokenKey);
  }

  setTokens(token: string, refreshToken: string): void {
    localStorage.setItem(tokenKey, token);
    localStorage.setItem(refreshTokenKey, refreshToken);
  }

  clearTokens(): void {
    localStorage.removeItem(tokenKey);
    localStorage.removeItem(refreshTokenKey);
  }

  hasToken(): boolean {
    return Boolean(this.getToken());
  }
}
