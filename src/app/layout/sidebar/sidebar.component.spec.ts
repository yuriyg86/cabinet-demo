import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponents, MockDirective } from 'ng-mocks';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { TokenService } from '../../core/services/token.service';
import { SidebarComponent } from './sidebar.component';

describe(SidebarComponent.name, () => {
  let spectator: Spectator<SidebarComponent>;

  const createComponent = createComponentFactory({
    component: SidebarComponent,
    imports: [
      MockComponents(ConfirmDialogComponent),
      MockDirective(RouterLink),
      MockDirective(RouterLinkActive),
    ],
    providers: [
      mockProvider(TokenService, { clearTokens: jest.fn() }),
      mockProvider(Router, { navigate: jest.fn() }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('should create', () => {
    expect(spectator.component).toBeTruthy();
  });

  it('should start collapsed', () => {
    expect(spectator.component['collapsed']()).toBe(true);
  });

  describe('toggleCollapsed', () => {
    it('should toggle the collapsed state', () => {
      spectator.component['toggleCollapsed']();
      expect(spectator.component['collapsed']()).toBe(false);
      spectator.component['toggleCollapsed']();
      expect(spectator.component['collapsed']()).toBe(true);
    });
  });

  describe('onLogoutClick', () => {
    it('should open the confirm dialog', () => {
      spectator.component['onLogoutClick']();
      expect(spectator.component['confirmStore'].isOpen()).toBe(true);
    });
  });

  describe('onLogoutConfirmed', () => {
    it('should clear tokens and navigate to /login', () => {
      const tokenService = spectator.inject(TokenService);
      const router = spectator.inject(Router);
      spectator.component['onLogoutConfirmed']();
      expect(tokenService.clearTokens).toHaveBeenCalled();
      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    it('should close the confirm dialog', () => {
      spectator.component['confirmStore'].open('test');
      spectator.component['onLogoutConfirmed']();
      expect(spectator.component['confirmStore'].isOpen()).toBe(false);
    });
  });

  describe('onLogoutCancelled', () => {
    it('should close the confirm dialog', () => {
      spectator.component['confirmStore'].open('test');
      spectator.component['onLogoutCancelled']();
      expect(spectator.component['confirmStore'].isOpen()).toBe(false);
    });
  });
});
