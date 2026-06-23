import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-auth-register',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './auth-register.component.html',
  styleUrls: ['./auth-register.component.scss']
})
export class AuthRegisterComponent implements OnInit {
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
    this.successMessage = 'Redirecting to Keycloak registration...';
    this.authService.startKeycloakRegister('/login');
  }
}
