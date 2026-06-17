import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { LogonRequest, LogonResponse, RefreshTokenRequest, TokensResponse } from '../models/auth.models';

const apiBase = 'https://zidium3-backend.zidium.net';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  logon(request: LogonRequest) {
    return this.http.post<LogonResponse>(`${apiBase}/front/logon`, request);
  }

  refreshToken(request: RefreshTokenRequest) {
    return this.http.post<TokensResponse>(`${apiBase}/front/logon/refresh-token`, request);
  }
}
