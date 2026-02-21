import { Component } from '@angular/core';
import { AuthService } from '../../../core/services/auth.service';
import { Router } from '@angular/router';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-auth-register',
  imports: [ReactiveFormsModule, RouterModule, CommonModule],
  templateUrl: './auth-register.component.html',
  styleUrls: ['./auth-register.component.scss']
})
export class AuthRegisterComponent {
  registerForm: FormGroup;
  submitted = false;
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private fb: FormBuilder
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      username: ['', [
        Validators.required,
        Validators.minLength(3),
        Validators.maxLength(20),
        Validators.pattern(/^[a-zA-Z0-9._]+$/)
      ]],
      email: ['', [Validators.required, Validators.email]],
      phoneNumber: ['', [
        Validators.required,
        Validators.pattern(/^\+\d{1,3}\d{6,14}$/) // International format: +12334567890
      ]],
      gender: ['', Validators.required],
      age: ['', [Validators.required, Validators.min(18), Validators.max(150)]],
      password: ['', [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(50),
        this.passwordValidator.bind(this)
      ]],
      confirmPassword: ['', Validators.required],
      role: ['PATIENT', Validators.required]
    }, { 
      validators: this.passwordMatchValidator 
    });
  }

  // Custom password validator
  passwordValidator(control: AbstractControl): { [key: string]: any } | null {
    const value = control.value;
    if (!value) return null;

    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumeric = /[0-9]/.test(value);

    const passwordValid = hasUpperCase && hasLowerCase && hasNumeric;

    if (!passwordValid) {
      return { 
        passwordStrength: {
          hasUpperCase,
          hasLowerCase,
          hasNumeric
        }
      };
    }
    return null;
  }

  // Password match validator
  passwordMatchValidator(group: AbstractControl): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  // Getter for easy access to form fields
  get f() {
    return this.registerForm.controls;
  }

  getPasswordErrorMessage(): string {
    const control = this.f['password'];
    if (control.hasError('required')) {
      return 'Password is required';
    }
    if (control.hasError('minlength')) {
      return 'Password must be at least 6 characters';
    }
    if (control.hasError('maxlength')) {
      return 'Password must not exceed 50 characters';
    }
    if (control.hasError('passwordStrength')) {
      const errors = control.errors?.['passwordStrength'];
      if (!errors.hasUpperCase) {
        return 'Password must contain at least one uppercase letter';
      }
      if (!errors.hasLowerCase) {
        return 'Password must contain at least one lowercase letter';
      }
      if (!errors.hasNumeric) {
        return 'Password must contain at least one number';
      }
    }
    return '';
  }

  getConfirmPasswordErrorMessage(): string {
    const control = this.f['confirmPassword'];
    if (control.hasError('required')) {
      return 'Please confirm your password';
    }
    if (this.registerForm.hasError('passwordMismatch') && control.touched) {
      return 'Passwords do not match';
    }
    return '';
  }

  getPhoneErrorMessage(): string {
    const control = this.f['phoneNumber'];
    if (control.hasError('required')) {
      return 'Phone number is required';
    }
    if (control.hasError('pattern')) {
      return 'Phone number must be in format: +12334567890 (+ followed by country code and number)';
    }
    return '';
  }

  getAgeErrorMessage(): string {
    const control = this.f['age'];
    if (control.hasError('required')) {
      return 'Age is required';
    }
    if (control.hasError('min')) {
      return 'You must be at least 18 years old';
    }
    if (control.hasError('max')) {
      return 'Please enter a valid age';
    }
    return '';
  }

  getFieldErrorMessage(fieldName: string): string {
    const control = this.f[fieldName];
    if (control.hasError('required')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} is required`;
    }
    if (control.hasError('minlength')) {
      return `${fieldName.charAt(0).toUpperCase() + fieldName.slice(1)} must be at least ${control.errors?.['minlength'].requiredLength} characters`;
    }
    if (control.hasError('email')) {
      return 'Please enter a valid email address';
    }
    return '';
  }

  onRegister() {
    this.submitted = true;
    this.errorMessage = '';
    this.successMessage = '';

    // Stop if form is invalid
    if (this.registerForm.invalid) {
      console.log('Form is invalid:', this.registerForm.errors);
      return;
    }

    this.isLoading = true;
    const userData = { ...this.registerForm.value };
    delete userData.confirmPassword; // Remove confirmPassword before sending to backend

    console.log('Attempting to register user:', userData);

    this.authService.register(userData).subscribe({
      next: (response) => {
        console.log('Registration response:', response);
        this.isLoading = false;
        this.successMessage = 'Registration successful! Redirecting to login...';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        console.error('Registration error:', error);
        this.isLoading = false;
        
        if (error.message.includes('already exists')) {
          this.errorMessage = error.message;
        } else if (error.message.includes('Username')) {
          this.errorMessage = 'Username already taken. Please choose another.';
        } else if (error.message.includes('Email')) {
          this.errorMessage = 'Email already registered. Please use another or login.';
        } else {
          this.errorMessage = 'Registration failed. Please try again.';
        }
      }
    });
  }

  // Clear messages
  clearMessages() {
    this.errorMessage = '';
    this.successMessage = '';
  }
}