import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { LogonRequest, LogonResponse, RefreshTokenRequest, TokensResponse } from '../models/auth.models';
import { LogonService } from '../generated/api/logon.service';

@Injectable({ providedIn: 'root' })
export class AuthApiService {
  private readonly logonService = inject(LogonService);

  logon(request: LogonRequest): Observable<LogonResponse> {
    return this.logonService.logon(request);
  }

  refreshToken(request: RefreshTokenRequest): Observable<TokensResponse> {
    return this.logonService.refreshToken(request);
  }
}
