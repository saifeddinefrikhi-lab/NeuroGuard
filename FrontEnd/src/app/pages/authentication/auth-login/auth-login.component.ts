import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';  
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-login',
  templateUrl: './auth-login.component.html',
  styleUrls: ['./auth-login.component.scss'],
  imports: [ReactiveFormsModule, RouterModule, CommonModule]
})
export class AuthLoginComponent {
  loginForm: FormGroup;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  showPassword = false;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private fb: FormBuilder
  ) {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  getUsernameErrorMessage(): string {
    const control = this.f['username'];
    if (control.hasError('required')) {
      return 'Username is required';
    }
    if (control.hasError('minlength')) {
      return 'Username must be at least 3 characters';
    }
    return '';
  }

  getPasswordErrorMessage(): string {
    const control = this.f['password'];
    if (control.hasError('required')) {
      return 'Password is required';
    }
    if (control.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    return '';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  onLogin(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.loginForm.invalid) {
      console.log('Form is invalid');
      return;
    }

    this.isLoading = true;
    this.loginForm.disable();
    
    const credentials = this.loginForm.value;
    console.log('Attempting login...');

    this.authService.login(credentials).subscribe({
      next: (response) => {
        console.log('Login successful');
        this.isLoading = false;
        this.loginForm.enable();
        this.successMessage = 'Login successful! Redirecting...';
        
        const token = localStorage.getItem('authToken');
        if (token) {
          const userRole = this.authService.getRoleFromToken(token);
          console.log('User role:', userRole);
          setTimeout(() => {
            this.authService.redirectBasedOnRole(userRole);
          }, 1500);
        }
      },
      error: (error) => {
        console.error('Login error:', error);
        this.isLoading = false;
        this.loginForm.enable();
        
        if (error.message) {
          this.errorMessage = error.message;
        } else if (error.error) {
          this.errorMessage = typeof error.error === 'string' ? error.error : 'Invalid credentials';
        } else {
          this.errorMessage = 'Login failed. Please check your credentials.';
        }
        
        this.loginForm.markAllAsTouched();
      }
    });
  }
}