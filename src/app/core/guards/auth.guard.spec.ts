import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { mockProvider } from '@ngneat/spectator/jest';
import { authGuard } from './auth.guard';
import { TokenService } from '../services/token.service';

describe('authGuard', () => {
  const runGuard = (): ReturnType<typeof authGuard> =>
    TestBed.runInInjectionContext(() => authGuard({} as never, {} as never));

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        mockProvider(TokenService, { hasToken: jest.fn().mockReturnValue(false) }),
        mockProvider(Router, { createUrlTree: jest.fn((commands) => commands) }),
      ],
    });
  });

  it('should return true when a token exists', () => {
    TestBed.inject(TokenService).hasToken = jest.fn().mockReturnValue(true);
    expect(runGuard()).toBe(true);
  });

  it('should redirect to /login when no token exists', () => {
    const router = TestBed.inject(Router);
    runGuard();
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login']);
  });
});
