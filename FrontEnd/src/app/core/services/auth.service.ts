import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, tap, catchError, throwError, BehaviorSubject } from 'rxjs';
import { Router } from '@angular/router';
import Keycloak from 'keycloak-js';
import { environment } from '../../../environments/environment';

export interface CurrentUser {
  name: string;
  username: string;
  firstName?: string;
  lastName?: string;
  role: string;
  userId: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private keycloakClient: any = null;
  currentUser: CurrentUser | null = null;
  private isLoggedInSubject = new BehaviorSubject<boolean>(false);
  public isLoggedIn$ = this.isLoggedInSubject.asObservable();

  private readonly jwtPattern = /^[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+\.[A-Za-z0-9-_]+$/;
  private expectedRole: string | null = null;

  constructor(private http: HttpClient, private router: Router) {
    this.setupStorageShield();
    this.initializeCurrentUser();
  }

  async initializeKeycloakSession(): Promise<void> {
    if (!this.keycloakClient) {
      this.keycloakClient = new Keycloak({
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId
      });
    }

    const authenticated = await this.keycloakClient.init({
      onLoad: 'login-required',
      pkceMethod: 'S256',
      checkLoginIframe: false
    });

    if (authenticated) {
      this.syncSessionFromKeycloak();
    }
  }

  startKeycloakLogin(redirectPath: string = '/homePage', loginHint?: string): void {
    if (!this.keycloakClient) {
      this.keycloakClient = new Keycloak({
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId
      });
    }

    this.keycloakClient.login({
      redirectUri: `${window.location.origin}${redirectPath}`,
      loginHint
    });
  }

  startKeycloakRegister(redirectPath: string = '/login'): void {
    if (!this.keycloakClient) {
      this.keycloakClient = new Keycloak({
        url: environment.keycloak.url,
        realm: environment.keycloak.realm,
        clientId: environment.keycloak.clientId
      });
    }

    this.keycloakClient.register({
      redirectUri: `${window.location.origin}${redirectPath}`
    });
  }

  syncSessionFromKeycloak(): void {
    const token = this.keycloakClient?.token;

    if (!token) {
      return;
    }

    localStorage.setItem('authToken', token);

    try {
      const payload = this.decodeJwtPayload(token);
      const firstName = payload.firstName || payload.given_name || '';
      const lastName = payload.lastName || payload.family_name || '';
      const username = payload.username || payload.preferred_username || payload.sub || 'user';
      const fullName = `${firstName} ${lastName}`.trim() || payload.name || username || 'User';

      this.currentUser = {
        name: fullName,
        username,
        firstName,
        lastName,
        role: this.resolveRole(payload),
        userId: this.resolveUserId(payload)
      };
      this.expectedRole = this.currentUser.role;
      this.isLoggedInSubject.next(true);
    } catch (error) {
      console.error('Error parsing Keycloak token:', error);
    }
  }

  get isLoggedIn(): boolean {
    return this.isLoggedInSubject.value;
  }

  private setupStorageShield() {
    const originalSetItem = localStorage.setItem.bind(localStorage);
    const originalGetItem = localStorage.getItem.bind(localStorage);

    localStorage.setItem = (key: string, value: string) => {
      if (key === 'authToken') {
        try {
          const payload = this.decodeJwtPayload(value);
          console.group('%c[STORAGE SHIELD] setItem Detected', 'color: #00ff00; font-weight: bold;');
          console.log(`Setting Role: ${this.resolveRole(payload)} | UserId: ${this.resolveUserId(payload)}`);
          console.trace();
          console.groupEnd();
        } catch {
          console.warn('[STORAGE SHIELD] Setting invalid token string');
        }
      }
      originalSetItem(key, value);
    };

    localStorage.getItem = (key: string): string | null => {
      const val = originalGetItem(key);
      if (key === 'authToken' && val) {
        try {
          const payload = this.decodeJwtPayload(val);
          const payloadRole = this.resolveRole(payload);
          if (this.expectedRole && payloadRole !== this.expectedRole) {
            console.warn(`%c[STORAGE SHIELD] Session Alert! Expected ${this.expectedRole} token but got ${payloadRole}`, 'color: #ffa500; font-weight: bold;');
            console.trace();
          }
        } catch {
          // Ignore malformed token reads.
        }
      }
      return val;
    };
  }

  private initializeCurrentUser(): void {
    const storedAuthValue = localStorage.getItem('authToken');
    const token = this.extractJwtToken(storedAuthValue);

    if (!token) {
      this.isLoggedInSubject.next(false);
      return;
    }

    try {
      const payload = this.decodeJwtPayload(token);
      const firstName = payload.firstName || '';
      const lastName = payload.lastName || '';
      const username = payload.username || payload.preferred_username || payload.sub || 'user';
      const fullName = `${firstName} ${lastName}`.trim() || payload.name || username || 'User';

      this.currentUser = {
        name: fullName,
        username,
        firstName,
        lastName,
        role: this.resolveRole(payload),
        userId: this.resolveUserId(payload)
      };
      this.isLoggedInSubject.next(true);
    } catch (error) {
      console.error('Error parsing token:', error);
      localStorage.removeItem('authToken');
      this.currentUser = null;
      this.isLoggedInSubject.next(false);
    }
  }

  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/register`, user, { responseType: 'text' }).pipe(
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
      }),
      catchError(this.handleError)
    );
  }

  login(credentials: any): Observable<any> {
    this.expectedRole = null;

    return this.http.post(`${this.apiUrl}/auth/login`, credentials, { responseType: 'text' }).pipe(
      tap((responseBody: string) => {
        const token = this.extractJwtToken(responseBody);

        if (!token) {
          throw new Error('Invalid username or password.');
        }

        localStorage.setItem('authToken', token);

        try {
          const payload = this.decodeJwtPayload(token);
          const firstName = payload.firstName || '';
          const lastName = payload.lastName || '';
          const username = payload.username || payload.preferred_username || payload.sub || credentials.username;
          const fullName = `${firstName} ${lastName}`.trim() || payload.name || username || credentials.username;

          this.currentUser = {
            name: fullName,
            username,
            firstName,
            lastName,
            role: this.resolveRole(payload),
            userId: this.resolveUserId(payload)
          };
          this.expectedRole = this.currentUser.role;
          this.isLoggedInSubject.next(true);
        } catch {
          localStorage.removeItem('authToken');
          this.isLoggedInSubject.next(false);
          throw new Error('Invalid token received. Please try again.');
        }
      }),
      catchError(this.handleError)
    );
  }

  googleLogin(idToken: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/google`, { idToken }).pipe(
      tap((response: any) => {
        if (response.newUser) {
          return;
        }

        const token = this.extractJwtToken(response);
        if (!token) {
          throw new Error('Invalid token received from Google authentication.');
        }

        localStorage.setItem('authToken', token);
        this.initializeCurrentUser();
      }),
      catchError(this.handleError)
    );
  }

  googleComplete(idToken: string, role: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/auth/google/complete`, { idToken, role }).pipe(
      tap((response: any) => {
        const token = this.extractJwtToken(response);
        if (!token) {
          throw new Error('Failed to complete registration.');
        }

        localStorage.setItem('authToken', token);
        this.initializeCurrentUser();
      }),
      catchError(this.handleError)
    );
  }

  logout(): void {
    const redirectUri = `${window.location.origin}/homePage`;
    this.clearLocalSession();

    if (this.keycloakClient?.authenticated) {
      void this.keycloakClient.logout({ redirectUri });
      return;
    }

    this.http.post(`${this.apiUrl}/auth/logout`, {}).subscribe({
      next: () => console.log('[AuthService] Logout completed on backend'),
      error: (err) => console.warn('[AuthService] Backend logout failed, but local session cleared', err)
    });
  }

  private clearLocalSession(): void {
    this.expectedRole = null;
    localStorage.removeItem('authToken');
    this.currentUser = null;
    this.isLoggedInSubject.next(false);
  }

  redirectBasedOnRole(role: string): void {
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

  getRoleFromToken(token: string): string {
    const payload = this.decodeJwtPayload(token);
    return this.resolveRole(payload);
  }

  getCurrentUserId(): number | null {
    return this.currentUser?.userId || null;
  }

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
          if (error.status === 403 && raw && (raw.includes('banned') || raw.includes('disabled'))) {
            errorMessage = raw;
          } else {
            errorMessage = 'Invalid username or password.';
          }
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
    const raw = localStorage.getItem('authToken');
    const token = this.extractJwtToken(raw);

    if (!token) {
      return null;
    }

    if (this.expectedRole) {
      try {
        const payload = this.decodeJwtPayload(token);
        if (this.resolveRole(payload) !== this.expectedRole) {
          console.error(`[AUTH CRITICAL] Token inconsistency detected! Expected ${this.expectedRole} but found ${this.resolveRole(payload)}.`);
          localStorage.removeItem('authToken');
          this.currentUser = null;
          this.isLoggedInSubject.next(false);
          return null;
        }
      } catch (e) {
        console.warn('[AUTH] Failed to validate token payload:', e);
        localStorage.removeItem('authToken');
        return null;
      }
    }

    return token;
  }

  private extractJwtToken(rawValue: unknown): string | null {
    if (!rawValue) {
      return null;
    }

    if (typeof rawValue === 'object') {
      const obj = rawValue as any;
      const candidate = obj.token || obj.accessToken || obj.jwt;
      if (typeof candidate === 'string' && this.jwtPattern.test(candidate.trim())) {
        return candidate.trim();
      }
      return null;
    }

    if (typeof rawValue !== 'string' || !rawValue.trim()) {
      return null;
    }

    const trimmed = rawValue.trim();
    if (this.jwtPattern.test(trimmed)) {
      return trimmed;
    }

    try {
      const parsed = JSON.parse(trimmed);
      const candidate = parsed?.token || parsed?.accessToken || parsed?.jwt;

      if (typeof candidate === 'string' && this.jwtPattern.test(candidate.trim())) {
        return candidate.trim();
      }
    } catch {
      return null;
    }

    return null;
  }

  private decodeJwtPayload(token: string): any {
    const payloadPart = token.split('.')[1];
    const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    return JSON.parse(atob(padded));
  }

  private resolveRole(payload: any): string {
    if (payload?.role) {
      return payload.role;
    }

    const roles = payload?.realm_access?.roles;
    if (Array.isArray(roles) && roles.length > 0) {
      const preferred = ['ADMIN', 'PROVIDER', 'CAREGIVER', 'PATIENT'];
      for (const role of preferred) {
        if (roles.includes(role)) {
          return role;
        }
      }
      return roles[0];
    }

    return 'PATIENT';
  }

  private resolveUserId(payload: any): number {
    const rawUserId = payload?.userId ?? payload?.user_id ?? payload?.sub;
    const parsed = Number(rawUserId);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/forgot-password`, { email }).pipe(
      catchError(this.handleError)
    );
  }

  resetPassword(token: string, newPassword: string, confirmPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/auth/reset-password`, {
      token,
      newPassword,
      confirmPassword
    }).pipe(
      catchError(this.handleError)
    );
  }
}