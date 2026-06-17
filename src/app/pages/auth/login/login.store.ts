import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { signalStore, withState, withMethods, patchState } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { EMPTY, pipe, switchMap, tap } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthApiService } from '../../../api/services/auth-api.service';
import { TokenService } from '../../../core/services/token.service';
import { LogonRequest } from '../../../api/models/auth.models';

interface LoginState {
  loading: boolean;
  error: string | null;
}

const initialState: LoginState = {
  loading: false,
  error: null,
};

export const LoginStore = signalStore(
  withState(initialState),
  withMethods(
    (store, authApi = inject(AuthApiService), tokenService = inject(TokenService), router = inject(Router)) => ({
      login: rxMethod<LogonRequest>(
        pipe(
          tap(() => patchState(store, { loading: true, error: null })),
          switchMap((request) =>
            authApi.logon(request).pipe(
              tap((response) => {
                patchState(store, { loading: false });
                tokenService.setTokens(response.token, response.refreshToken);
                router.navigate(['/categories']);
              }),
              catchError(() => {
                patchState(store, { loading: false, error: 'Invalid login or password' });
                return EMPTY;
              }),
            ),
          ),
        ),
      ),
    }),
  ),
);
