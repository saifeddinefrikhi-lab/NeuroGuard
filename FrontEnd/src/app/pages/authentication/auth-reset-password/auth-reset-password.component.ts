import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';  
import { Router, ActivatedRoute } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-reset-password',
  templateUrl: './auth-reset-password.component.html',
  styleUrls: ['./auth-reset-password.component.scss'],
  imports: [ReactiveFormsModule, RouterModule, CommonModule]
})
export class AuthResetPasswordComponent implements OnInit {
  resetPasswordForm: FormGroup;
  submitted = false;
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  token: string | null = null;
  isTokenValid = false;
  tokenValidationLoading = true;

  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.resetPasswordForm = this.fb.group({
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    // Get token from query parameters
    this.token = this.route.snapshot.queryParamMap.get('token');
    
    if (!this.token) {
      this.errorMessage = 'Reset token is missing or invalid. Please request a new password reset.';
      this.tokenValidationLoading = false;
      return;
    }

    // Validate token format (basic UUID check)
    if (!this.isValidTokenFormat(this.token)) {
      this.errorMessage = 'Invalid reset token format. Please request a new password reset.';
      this.tokenValidationLoading = false;
      return;
    }

    // Token format is valid, proceed
    this.isTokenValid = true;
    this.tokenValidationLoading = false;
  }

  get f() {
    return this.resetPasswordForm.controls;
  }

  // Custom validator for password matching
  passwordMatchValidator(form: FormGroup): { [key: string]: boolean } | null {
    const newPassword = form.get('newPassword')?.value;
    const confirmPassword = form.get('confirmPassword')?.value;
    
    if (newPassword !== confirmPassword) {
      form.get('confirmPassword')?.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    return null;
  }

  getNewPasswordErrorMessage(): string {
    const control = this.f['newPassword'];
    if (control.hasError('required')) {
      return 'New password is required';
    }
    if (control.hasError('minlength')) {
      return 'Password must be at least 6 characters long';
    }
    return '';
  }

  getConfirmPasswordErrorMessage(): string {
    const control = this.f['confirmPassword'];
    if (control.hasError('required')) {
      return 'Password confirmation is required';
    }
    if (control.hasError('passwordMismatch')) {
      return 'Passwords do not match';
    }
    return '';
  }

  clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  isValidTokenFormat(token: string): boolean {
    // Basic UUID format validation
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(token);
  }

  onResetPassword(): void {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    if (this.resetPasswordForm.invalid) {
      console.log('Form is invalid');
      return;
    }

    if (!this.token) {
      this.errorMessage = 'Reset token is missing. Please request a new password reset.';
      return;
    }

    this.isLoading = true;
    this.resetPasswordForm.disable();
    
    const { newPassword, confirmPassword } = this.resetPasswordForm.value;
    console.log('Resetting password with token');

    this.authService.resetPassword(this.token, newPassword, confirmPassword).subscribe({
      next: (response) => {
        console.log('Password reset successful');
        this.isLoading = false;
        this.resetPasswordForm.enable();
        this.successMessage = 'Password has been reset successfully! Redirecting to login...';
        
        // Redirect to login after 3 seconds
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (error) => {
        console.error('Password reset error:', error);
        this.isLoading = false;
        this.resetPasswordForm.enable();
        
        if (error.message) {
          this.errorMessage = error.message;
        } else if (error.error) {
          this.errorMessage = typeof error.error === 'string' ? error.error : 'Failed to reset password';
        } else {
          this.errorMessage = 'An error occurred. Please try again or request a new reset link.';
        }
        
        this.resetPasswordForm.markAllAsTouched();
      }
    });
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Password strength helper methods
  getPasswordStrengthPercentage(password: string): number {
    if (!password) return 0;
    
    let strength = 0;
    
    // Length contribution
    if (password.length >= 6) strength += 25;
    if (password.length >= 10) strength += 25;
    
    // Character variety contribution
    if (/[a-z]/.test(password)) strength += 12.5;
    if (/[A-Z]/.test(password)) strength += 12.5;
    if (/[0-9]/.test(password)) strength += 12.5;
    if (/[^a-zA-Z0-9]/.test(password)) strength += 12.5;
    
    return Math.min(strength, 100);
  }

  getPasswordStrengthClass(password: string): string {
    const percentage = this.getPasswordStrengthPercentage(password);
    
    if (percentage < 30) return 'bg-danger';
    if (percentage < 60) return 'bg-warning';
    if (percentage < 80) return 'bg-info';
    return 'bg-success';
  }

  getPasswordStrengthText(password: string): string {
    const percentage = this.getPasswordStrengthPercentage(password);
    
    if (percentage < 30) return 'Weak';
    if (percentage < 60) return 'Fair';
    if (percentage < 80) return 'Good';
    return 'Strong';
  }
}
