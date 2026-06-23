import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-login',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './auth-login.component.html',
  styleUrls: ['./auth-login.component.scss']
})
export class AuthLoginComponent implements OnInit {
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    if (this.authService.isLoggedIn && this.authService.currentUser) {
      this.authService.redirectBasedOnRole(this.authService.currentUser.role);
      return;
    }

    this.redirectToKeycloak();
  }

  redirectToKeycloak(): void {
    this.isLoading = true;
    this.successMessage = 'Redirecting to Keycloak...';
    this.authService.startKeycloakLogin('/homePage');
  }
}
