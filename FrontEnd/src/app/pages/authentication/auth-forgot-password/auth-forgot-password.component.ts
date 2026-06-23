import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';  
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-forgot-password',
  templateUrl: './auth-forgot-password.component.html',
  styleUrls: ['./auth-forgot-password.component.scss'],
  imports: [ReactiveFormsModule, RouterModule, CommonModule]
})
export class AuthForgotPasswordComponent {
  forgotPasswordForm: FormGroup;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  isLoading = false;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private fb: FormBuilder
  ) {
    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get f() {
    return this.forgotPasswordForm.controls;
  }

  getEmailErrorMessage(): string {
    const control = this.f['email'];
    if (control.hasError('required')) {
      return 'Email is required';
    }
    if (control.hasError('email')) {
      return 'Please enter a valid email address';
    }
    return '';
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  onForgotPassword(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.forgotPasswordForm.invalid) {
      console.log('Form is invalid');
      return;
    }

    this.isLoading = true;
    this.forgotPasswordForm.disable();
    
    const email = this.forgotPasswordForm.value.email;
    console.log('Sending forgot password request for:', email);

    this.authService.forgotPassword(email).subscribe({
      next: (response) => {
        console.log('Forgot password request successful');
        this.isLoading = false;
        this.forgotPasswordForm.enable();
        this.successMessage = 'Password reset link has been sent to your email. Please check your inbox.';
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        console.error('Forgot password error:', error);
        this.isLoading = false;
        this.forgotPasswordForm.enable();
        
        if (error.message) {
          this.errorMessage = error.message;
        } else if (error.error) {
          this.errorMessage = typeof error.error === 'string' ? error.error : 'Failed to send password reset email';
        } else {
          this.errorMessage = 'An error occurred. Please try again.';
        }
        
        this.forgotPasswordForm.markAllAsTouched();
      }
    });
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
