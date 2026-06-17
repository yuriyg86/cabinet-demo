import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { ConfirmDialogStore } from '../../shared/confirm-dialog/confirm-dialog.store';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog/confirm-dialog.component';
import { TokenService } from '../../core/services/token.service';

@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [ConfirmDialogStore],
  imports: [RouterLink, RouterLinkActive, ConfirmDialogComponent],
})
export class SidebarComponent {
  protected readonly confirmStore = inject(ConfirmDialogStore);
  private readonly tokenService = inject(TokenService);
  private readonly router = inject(Router);

  protected readonly collapsed = signal(true);

  protected toggleCollapsed(): void {
    this.collapsed.update((v) => !v);
  }

  protected onLogoutClick(): void {
    this.confirmStore.open('Are you sure you want to log out?');
  }

  protected onLogoutConfirmed(): void {
    this.confirmStore.close();
    this.tokenService.clearTokens();
    this.router.navigate(['/login']);
  }

  protected onLogoutCancelled(): void {
    this.confirmStore.close();
  }
}
