import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { AuthApiService } from '../../api/services/auth-api.service';
import { TokenService } from '../services/token.service';
import { authInterceptor } from './auth.interceptor';

describe('authInterceptor', () => {
  let http: HttpClient;
  let httpMock: HttpTestingController;
  let tokenService: jest.Mocked<TokenService>;
  let authApi: jest.Mocked<AuthApiService>;
  let router: jest.Mocked<Router>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        mockProvider(TokenService, {
          getToken: jest.fn().mockReturnValue(null),
          getRefreshToken: jest.fn().mockReturnValue(null),
          setTokens: jest.fn(),
          clearTokens: jest.fn(),
        }),
        mockProvider(AuthApiService, {
          refreshToken: jest.fn(() => of({ token: 'new-tok', refreshToken: 'new-ref' })),
        }),
        mockProvider(Router, { navigate: jest.fn() }),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpMock = TestBed.inject(HttpTestingController);
    tokenService = TestBed.inject(TokenService) as jest.Mocked<TokenService>;
    authApi = TestBed.inject(AuthApiService) as jest.Mocked<AuthApiService>;
    router = TestBed.inject(Router) as jest.Mocked<Router>;
  });

  afterEach(() => httpMock.verify());

  it('should add Authorization header when token exists', () => {
    tokenService.getToken.mockReturnValue('my-token');

    http.get('/test').subscribe();

    const req = httpMock.expectOne('/test');
    expect(req.request.headers.get('Authorization')).toBe('Bearer my-token');
    req.flush({});
  });

  it('should not add Authorization header when no token', () => {
    tokenService.getToken.mockReturnValue(null);

    http.get('/test').subscribe();

    const req = httpMock.expectOne('/test');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({});
  });

  it('should refresh token and retry on 401 when refresh token exists', () => {
    tokenService.getToken.mockReturnValue('old-tok');
    tokenService.getRefreshToken.mockReturnValue('old-ref');

    http.get('/test').subscribe();

    const req = httpMock.expectOne('/test');
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authApi.refreshToken).toHaveBeenCalledWith({ refreshToken: 'old-ref' });
    expect(tokenService.setTokens).toHaveBeenCalledWith('new-tok', 'new-ref');

    const retryReq = httpMock.expectOne('/test');
    expect(retryReq.request.headers.get('Authorization')).toBe('Bearer new-tok');
    retryReq.flush({});
  });

  it('should clear tokens and navigate to /login on 401 when no refresh token', () => {
    tokenService.getToken.mockReturnValue('old-tok');
    tokenService.getRefreshToken.mockReturnValue(null);

    http.get('/test').subscribe({ error: jest.fn() });

    const req = httpMock.expectOne('/test');
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(tokenService.clearTokens).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/login']);
  });

  it('should not attempt refresh for /front/logon requests', () => {
    tokenService.getToken.mockReturnValue('old-tok');

    http.get('/front/logon').subscribe({ error: jest.fn() });

    const req = httpMock.expectOne('/front/logon');
    req.flush(null, { status: 401, statusText: 'Unauthorized' });

    expect(authApi.refreshToken).not.toHaveBeenCalled();
  });
});
