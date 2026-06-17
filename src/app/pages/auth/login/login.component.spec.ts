import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { NEVER } from 'rxjs';
import { AuthApiService } from '../../../api/services/auth-api.service';
import { TokenService } from '../../../core/services/token.service';
import { LoginComponent } from './login.component';

describe(LoginComponent.name, () => {
  let spectator: Spectator<LoginComponent>;

  const createComponent = createComponentFactory({
    component: LoginComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockProvider(AuthApiService, { logon: jest.fn(() => NEVER) }),
      mockProvider(TokenService, { setTokens: jest.fn() }),
      mockProvider(Router, { navigate: jest.fn() }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  describe('onSubmit', () => {
    it('should mark form as touched and not submit when form is invalid', () => {
      const authApi = spectator.inject(AuthApiService);
      spectator.component['onSubmit']();
      expect(authApi.logon).not.toHaveBeenCalled();
      expect(spectator.component['form'].touched).toBe(true);
    });

    it('should call store.login when form is valid', () => {
      const authApi = spectator.inject(AuthApiService);
      spectator.component['form'].setValue({ login: 'user', password: 'secret' });
      spectator.component['onSubmit']();
      expect(authApi.logon).toHaveBeenCalledWith({ login: 'user', password: 'secret' });
    });
  });

  describe('loginControl getter', () => {
    it('should return the login form control', () => {
      expect(spectator.component['loginControl']).toBe(spectator.component['form'].controls.login);
    });
  });

  describe('passwordControl getter', () => {
    it('should return the password form control', () => {
      expect(spectator.component['passwordControl']).toBe(spectator.component['form'].controls.password);
    });
  });
});
