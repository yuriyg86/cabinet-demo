import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LogonRequest, LogonResponse, RefreshTokenRequest, TokensResponse } from '../models/auth.models';

const apiBase = 'https://zidium3-backend.zidium.net';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly http = inject(HttpClient);

  logon(request: LogonRequest): Observable<LogonResponse> {
    return this.http.post<LogonResponse>(`${apiBase}/front/logon`, request);
  }

  refreshToken(request: RefreshTokenRequest): Observable<TokensResponse> {
    return this.http.post<TokensResponse>(`${apiBase}/front/logon/refresh-token`, request);
  }
}
