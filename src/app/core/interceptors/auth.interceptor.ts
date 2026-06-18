import { HttpInterceptorFn, HttpRequest, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError } from 'rxjs';
import { TokenService } from '../services/token.service';
import { AuthApiService } from '../../api/services/auth-api.service';
import { Router } from '@angular/router';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const tokenService = inject(TokenService);
  const authApi = inject(AuthApiService);
  const router = inject(Router);

  const token = tokenService.getToken();
  const authorizedReq = token ? addToken(req, token) : req;

  return next(authorizedReq).pipe(
    catchError((error: unknown) => {
      const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;
      const isRefreshRequest = req.url.includes('/front/logon'); // TODO It's not good to hardcode endpoint this way, but 'generated' doesn't export

      if (!isUnauthorized || isRefreshRequest) {
        return throwError(() => error);
      }

      const refreshToken = tokenService.getRefreshToken();
      if (!refreshToken) {
        tokenService.clearTokens();
        router.navigate(['/login']);
        return throwError(() => error);
      }

      return authApi.refreshToken({ refreshToken }).pipe(
        switchMap((tokens) => {
          tokenService.setTokens(tokens.token, tokens.refreshToken);
          return next(addToken(req, tokens.token));
        }),
        catchError((refreshError: unknown) => {
          tokenService.clearTokens();
          router.navigate(['/login']);
          return throwError(() => refreshError);
        }),
      );
    }),
  );
};

function addToken(req: HttpRequest<unknown>, token: string): HttpRequest<unknown> {
  return req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
}
