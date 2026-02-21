import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError } from 'rxjs';
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

  constructor(private http: HttpClient, private router: Router) {
    this.initializeCurrentUser();
  }

  // Check if user is logged in based on stored token
  get isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
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
        } else {
          // Not a valid JWT, clear it
          localStorage.removeItem('authToken');
          this.currentUser = null;
        }
      } catch (error) {
        console.error('Error parsing token:', error);
        localStorage.removeItem('authToken');
        this.currentUser = null;
      }
    }
  }

  // Register a new user
  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, user, {
      responseType: 'text'
    }).pipe(
      catchError(this.handleError)
    );
  }

  // Login and get JWT token
  login(credentials: any): Observable<any> {
  return this.http.post(`${this.apiUrl}/auth/login`, credentials, { 
    responseType: 'text'
  }).pipe(
    tap((token: string) => {
      console.log('Received token (raw):', token);
      console.log('Token length:', token?.length);
      
      // Trim whitespace from token
      const trimmedToken = token?.trim() || '';
      console.log('Trimmed token:', trimmedToken);
      console.log('Trimmed token length:', trimmedToken.length);
      
      // Check if token is valid (should be a JWT with 3 parts)
      const tokenParts = trimmedToken.split('.');
      console.log('Token parts count:', tokenParts.length);
      
      if (tokenParts.length !== 3) {
        console.error('Invalid token format. Expected 3 parts, got:', tokenParts.length);
        throw new Error('Invalid token format received from server');
      }

      // Store token in localStorage
      localStorage.setItem('authToken', trimmedToken);
      console.log('Token saved to localStorage');

      // Decode token
      try {
        const payload = JSON.parse(atob(tokenParts[1]));
        console.log('Decoded payload:', payload);
        this.currentUser = {
          name: payload.name || payload.username || payload.sub || credentials.username,
          role: payload.role,
          userId: payload.userId
        };
        console.log('Current user set:', this.currentUser);
      } catch (error) {
        console.error('Error decoding token:', error);
        localStorage.removeItem('authToken');
        throw new Error('Invalid token payload');
      }
    }),
    catchError(this.handleError)
  );
}

  // Logout the user and clear token
  logout() {
    localStorage.removeItem('authToken');
    this.currentUser = null;
    this.router.navigate(['/login']);
  }

  // Redirect user to their respective dashboard based on role
  redirectBasedOnRole(role: string) {
    if (role === 'ADMIN') {
      this.router.navigate(['/admin/dashboard']);
    } else if (role === 'PATIENT') {
      this.router.navigate(['/patient/home']);
    } else if (role === 'PROVIDER') {
      this.router.navigate(['/provider/medical-history']);
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
    
    if (error instanceof Error) {
      // Client-side error (thrown from tap or other operators)
      errorMessage = error.message;
    } else if (error.error instanceof ErrorEvent) {
      // Client-side network error
      errorMessage = `Error: ${error.error.message}`;
    } else if (error.status) {
      // Backend error with status code
      errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
    } else {
      // Other errors
      errorMessage = error.message || 'Unknown error occurred';
    }
    
    console.error('Auth Service Error:', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
  
  getToken(): string | null {
  return localStorage.getItem('authToken');
}
}