import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-restricted',
  standalone: true,
  template: `
    <div class="auth-main">
      <div class="auth-wrapper v3">
        <div class="auth-form">
          <div class="card my-5">
            <div class="card-body text-center">
              <div class="mb-4">
                <i class="ti ti-lock" style="font-size: 64px; color: #dc3545;"></i>
              </div>
              <h3 class="mb-3"><b>Access Restricted</b></h3>
              <p class="text-muted mb-4">
                You don't have permission to access this page.
              </p>
              <button class="btn btn-primary" (click)="goToHome()">
                Go to Your Dashboard
              </button>
              <button class="btn btn-outline-secondary ms-2" (click)="logout()">
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-main {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  `]
})
export class RestrictedComponent {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  goToHome() {
    if (this.authService.currentUser) {
      this.authService.redirectBasedOnRole(this.authService.currentUser.role);
    } else {
      this.router.navigate(['/login']);
    }
  }

  logout() {
    this.authService.logout();
  }
}