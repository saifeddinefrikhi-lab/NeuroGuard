import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment';

export interface CurrentUser {
  name: string;
  role: string;
  userId: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;  // URL of the backend API (gateway)
  currentUser: CurrentUser | null = null;
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {
    this.initializeCurrentUser();
  }

  // Check if user is logged in based on stored token
  get isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  // Initialize the current user by decoding the token stored in localStorage
  private initializeCurrentUser() {
    const token = localStorage.getItem('authToken');
    if (token) {
      try {
        // Check if the token is a valid JWT (3 parts separated by dots)
        if (token.split('.').length === 3) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          this.currentUser = {
            name: payload.name || payload.username || payload.sub || 'User',
            role: payload.role,
            userId: payload.userId   // <-- userId from token
          };
          this.isLoggedInSubject.next(true);
        } else {
          // Not a valid JWT, clear it
          localStorage.removeItem('authToken');
          this.currentUser = null;
          this.isLoggedInSubject.next(false);
        }
      } catch (error) {
        console.error('Error parsing token:', error);
        localStorage.removeItem('authToken');
        this.currentUser = null;
        this.isLoggedInSubject.next(false);
      }
    } else {
      this.isLoggedInSubject.next(false);
    }
  }

  // Register a new user
  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, user, {
      responseType: 'text'
    }).pipe(
      tap((responseText: string) => {
        const message = (responseText || '').toString().trim();
        if (!message) {
          return;
        }
        const lowered = message.toLowerCase();
        if (lowered.includes('already exists') || lowered.includes('already exist')) {
          if (lowered.includes('email')) {
            throw new Error('Email already registered. Please use another or login.');
          }
          if (lowered.includes('username')) {
            throw new Error('Username already taken. Please choose another.');
          }
          throw new Error('An account with these details already exists.');
        }
        if (lowered.includes('duplicate') || lowered.includes('conflict')) {
          throw new Error('An account with these details already exists.');
        }
        if (lowered.includes('exists')) {
          throw new Error('User already exists. Please use different information.');
        }
      }),
      catchError(this.handleError)
    );
  }

  // Login and get JWT token
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/login`, credentials, {
      responseType: 'text'
    }).pipe(
      tap((token: string) => {
        const trimmedToken = token?.trim() || '';
        const tokenParts = trimmedToken.split('.');

        if (tokenParts.length !== 3) {
          throw new Error('Invalid username or password.');
        }

        // Store token in localStorage
        localStorage.setItem('authToken', trimmedToken);

        // Decode token
        try {
          const payload = JSON.parse(atob(tokenParts[1]));
          this.currentUser = {
            name: payload.name || payload.username || payload.sub || credentials.username,
            role: payload.role,
            userId: payload.userId
          };
          this.isLoggedInSubject.next(true);
        } catch (error) {
          localStorage.removeItem('authToken');
          this.isLoggedInSubject.next(false);
          throw new Error('Invalid token received. Please try again.');
        }
      }),
      catchError(this.handleError)
    );
  }

  // Logout the user and clear token
  logout() {
    localStorage.removeItem('authToken');
    this.currentUser = null;
    this.isLoggedInSubject.next(false);
    this.router.navigate(['/homePage']);
  }

  // Redirect user to their respective dashboard based on role
  redirectBasedOnRole(role: string) {
    if (role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else if (role === 'PATIENT') {
      this.router.navigate(['/patient/home']);
    } else if (role === 'PROVIDER') {
      this.router.navigate(['/provider/home']);
    } else if (role === 'CAREGIVER') {
      this.router.navigate(['/caregiver/home']);
    }
  }

  // Helper function to extract role from JWT token
  getRoleFromToken(token: string): string {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  }

  // Get current user ID (convenience method)
  getCurrentUserId(): number | null {
    return this.currentUser?.userId || null;
  }

  // Handle HTTP error responses
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An unknown error occurred!';
    const url = error?.url || '';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.status) {
      const raw = typeof error.error === 'string' ? error.error : '';
      const lowered = raw.toLowerCase();

      if (url.includes('/auth/login')) {
        if (error.status === 401 || error.status === 403) {
          errorMessage = 'Invalid username or password.';
        } else if (raw) {
          errorMessage = raw;
        } else {
          errorMessage = 'Login failed. Please try again.';
        }
      } else if (url.includes('/auth/register')) {
        if (error.status === 409 || lowered.includes('already exists') || lowered.includes('duplicate')) {
          if (lowered.includes('email')) {
            errorMessage = 'Email already registered. Please use another or login.';
          } else if (lowered.includes('username')) {
            errorMessage = 'Username already taken. Please choose another.';
          } else {
            errorMessage = 'An account with these details already exists.';
          }
        } else if (raw) {
          errorMessage = raw;
        } else {
          errorMessage = 'Registration failed. Please try again.';
        }
      } else if (raw) {
        errorMessage = raw;
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    } else {
      errorMessage = error.message || 'Unknown error occurred';
    }

    console.error('Auth Service Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
  
  getToken(): string | null {
  return localStorage.getItem('authToken');
}
}