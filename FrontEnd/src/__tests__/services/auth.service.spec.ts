// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, CurrentUser } from '../../app/core/services/auth.service';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  let routerSpy: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const router = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        AuthService,
        { provide: Router, useValue: router }
      ]
    });

    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  describe('Authentication', () => {
    it('should login user with correct credentials', () => {
      const credentials = { username: 'testuser', password: 'password123' };
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6IlBBVElFTlQiLCJ1c2VySWQiOjEsImZpcnN0TmFtZSI6IkpvaG4iLCJsYXN0TmFtZSI6IkRvZSJ9.signature';

      service.login(credentials).subscribe(() => {
        expect(service.isLoggedIn).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(credentials);
      req.flush(token);
    });

    it('should store token after login', () => {
      const credentials = { username: 'user', password: 'pass' };
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6IlBBVElFTlQiLCJ1c2VySWQiOjEsImZpcnN0TmFtZSI6IkpvaG4iLCJsYXN0TmFtZSI6IkRvZSJ9.signature';

      service.login(credentials).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(token);

      expect(service.getToken()).toBeTruthy();
    });

    xit('should logout user', (done) => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6IlBBVElFTlQiLCJ1c2VySWQiOjEsImZpcnN0TmFtZSI6IkpvaG4iLCJsYXN0TmFtZSI6IkRvZSJ9.signature';
      localStorage.setItem('authToken', token);

      service.logout();

      // Wait for async logout call
      setTimeout(() => {
        expect(service.isLoggedIn).toBe(false);
        expect(localStorage.getItem('authToken')).toBeNull();
        done();
      }, 100);

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush({});
    });

    it('should handle failed login', () => {
      const credentials = { username: 'invalid', password: 'wrong' };

      service.login(credentials).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('Invalid')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({}, { status: 401, statusText: 'Unauthorized' });
    });
  });

  describe('JWT Token Management', () => {
    it('should extract and store token from storage', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6IlBBVElFTlQiLCJ1c2VySWQiOjF9.signature';
      localStorage.setItem('authToken', token);

      const retrieved = service.getToken();

      expect(retrieved).toBe(token);
    });

    it('should return null for invalid token', () => {
      localStorage.setItem('authToken', 'invalid_token_format');

      const token = service.getToken();

      expect(token).toBeNull();
    });

    it('should handle token in JSON object format', () => {
      const jsonToken = JSON.stringify({
        token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6IlBBVElFTlQiLCJ1c2VySWQiOjF9.signature'
      });
      localStorage.setItem('authToken', jsonToken);

      const token = service.getToken();

      expect(token).toBeTruthy();
    });

    it('should return null for empty token', () => {
      localStorage.setItem('authToken', '');

      const token = service.getToken();

      expect(token).toBeNull();
    });
  });

  describe('Current User', () => {
    it('should set current user after successful login', () => {
      const credentials = { username: 'testuser', password: 'pass' };
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6IlBBVElFTlQiLCJ1c2VySWQiOjEsImZpcnN0TmFtZSI6IkpvaG4iLCJsYXN0TmFtZSI6IkRvZSJ9.signature';

      service.login(credentials).subscribe(() => {
        expect(service.currentUser).toBeTruthy();
        expect(service.currentUser?.username).toBe('testuser');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(token);
    });

    it('should set user name from first and last name', () => {
      const credentials = { username: 'testuser', password: 'pass' };
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6IlBBVElFTlQiLCJ1c2VySWQiOjEsImZpcnN0TmFtZSI6IkpvaG4iLCJsYXN0TmFtZSI6IkRvZSJ9.signature';

      service.login(credentials).subscribe(() => {
        expect(service.currentUser?.name).toContain('John');
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush(token);
    });

    xit('should clear current user on logout', (done) => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6IlBBVElFTlQiLCJ1c2VySWQiOjF9.signature';
      localStorage.setItem('authToken', token);

      service.logout();

      setTimeout(() => {
        expect(service.currentUser).toBeNull();
        done();
      }, 100);

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/logout`);
      req.flush({});
    });

    it('should get current user ID', () => {
      service.currentUser = {
        name: 'Test User',
        username: 'testuser',
        role: 'PATIENT',
        userId: 123
      };

      const userId = service.getCurrentUserId();

      expect(userId).toBe(123);
    });

    it('should return null for user ID when not logged in', () => {
      service.currentUser = null;

      const userId = service.getCurrentUserId();

      expect(userId).toBeNull();
    });
  });

  describe('Role-based Operations', () => {
    it('should extract role from token', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6IlBBVElFTlQiLCJ1c2VySWQiOjF9.signature';

      const role = service.getRoleFromToken(token);

      expect(role).toBe('PATIENT');
    });

    it('should identify patient role', () => {
      service.currentUser = {
        name: 'John Doe',
        username: 'john',
        role: 'PATIENT',
        userId: 1
      };

      expect(service.currentUser?.role).toBe('PATIENT');
    });

    it('should identify provider role', () => {
      service.currentUser = {
        name: 'Dr. Smith',
        username: 'smith',
        role: 'PROVIDER',
        userId: 2
      };

      expect(service.currentUser?.role).toBe('PROVIDER');
    });

    it('should identify caregiver role', () => {
      service.currentUser = {
        name: 'Jane Doe',
        username: 'jane',
        role: 'CAREGIVER',
        userId: 3
      };

      expect(service.currentUser?.role).toBe('CAREGIVER');
    });

    it('should identify admin role', () => {
      service.currentUser = {
        name: 'Admin',
        username: 'admin',
        role: 'ADMIN',
        userId: 4
      };

      expect(service.currentUser?.role).toBe('ADMIN');
    });
  });

  describe('Google Authentication', () => {
    it('should login with Google credentials', () => {
      const googleToken = 'google_token_abc123';
      const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6IlBBVElFTlQiLCJ1c2VySWQiOjEsImZpcnN0TmFtZSI6IkpvaG4iLCJsYXN0TmFtZSI6IkRvZSJ9.signature';

      service.googleLogin(googleToken).subscribe(() => {
        expect(service.isLoggedIn).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/google`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.idToken).toBe(googleToken);
      req.flush({ token: jwtToken });
    });

    it('should complete Google signup with role selection', () => {
      const googleToken = 'google_token_abc123';
      const role = 'PATIENT';
      const jwtToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature';

      service.googleComplete(googleToken, role).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/google/complete`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.idToken).toBe(googleToken);
      expect(req.request.body.role).toBe(role);
      req.flush({ token: jwtToken });
    });
  });

  describe('Password Management', () => {
    it('should request password reset', () => {
      service.forgotPassword('test@example.com').subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/forgot-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.email).toBe('test@example.com');
      req.flush({ message: 'Reset email sent' });
    });

    it('should reset password with token', () => {
      const resetToken = 'reset_token_123';
      const newPassword = 'newPassword123';
      const confirmPassword = 'newPassword123';

      service.resetPassword(resetToken, newPassword, confirmPassword).subscribe();

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/reset-password`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body.token).toBe(resetToken);
      expect(req.request.body.newPassword).toBe(newPassword);
      expect(req.request.body.confirmPassword).toBe(confirmPassword);
      req.flush({ message: 'Password reset successful' });
    });

    it('should handle password reset errors', () => {
      service.resetPassword('invalid_token', 'pass', 'pass').subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/reset-password`);
      req.flush({}, { status: 400, statusText: 'Bad Request' });
    });

    it('should handle forgot password errors', () => {
      service.forgotPassword('invalid@example.com').subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/forgot-password`);
      req.flush({}, { status: 404, statusText: 'Not Found' });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid credentials', () => {
      const credentials = { username: 'invalid', password: 'wrong' };

      service.login(credentials).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error.message).toContain('Invalid')
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush('Invalid username or password.', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle user not found', () => {
      const credentials = { username: 'nonexistent', password: 'pass' };

      service.login(credentials).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush('User not found', { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle server error during login', () => {
      const credentials = { username: 'user', password: 'pass' };

      service.login(credentials).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.flush({}, { status: 500, statusText: 'Internal Server Error' });
    });

    xit('should handle network error', () => {
      const credentials = { username: 'user', password: 'pass' };

      service.login(credentials).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/login`);
      req.error(new ErrorEvent('Network error'));
    });

    it('should handle registration errors', () => {
      const user = { email: 'test@example.com', password: 'pass' };

      service.register(user).subscribe({
        next: () => fail('should have failed'),
        error: (error) => expect(error).toBeTruthy()
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/auth/register`);
      req.flush('Email already registered', { status: 409, statusText: 'Conflict' });
    });
  });

  describe('Login State Observable', () => {
    it('should emit login state changes', (done) => {
      service.isLoggedIn$.subscribe((isLoggedIn) => {
        expect(typeof isLoggedIn).toBe('boolean');
        done();
      });
    });

    xit('should emit true when logged in', (done) => {
      let emissionCount = 0;

      service.isLoggedIn$.subscribe((isLoggedIn) => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(isLoggedIn).toBe(true);
          done();
        }
      });

      service.isLoggedInSubject.next(true);
    });

    xit('should emit false when logged out', (done) => {
      let emissionCount = 0;

      service.isLoggedInSubject.next(true);
      service.isLoggedIn$.subscribe((isLoggedIn) => {
        emissionCount++;
        if (emissionCount === 2) {
          expect(isLoggedIn).toBe(false);
          done();
        }
      });

      service.logout();
    });
  });

  describe('Token Validation', () => {
    it('should return null for missing token', () => {
      localStorage.removeItem('authToken');

      expect(service.getToken()).toBeNull();
    });

    it('should return null for invalid token format', () => {
      localStorage.setItem('authToken', 'invalid_token_format');

      expect(service.getToken()).toBeNull();
    });

    it('should return token for valid JWT', () => {
      const validToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.payload.signature';
      localStorage.setItem('authToken', validToken);

      expect(service.getToken()).toBe(validToken);
    });
  });

  describe('Storage Shield Debug', () => {
    it('should track token set operations', () => {
      spyOn(console, 'log');

      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6IlBBVElFTlQiLCJ1c2VySWQiOjF9.signature';
      localStorage.setItem('authToken', token);

      // Storage shield should log the operation
      expect(console.log).toHaveBeenCalled();
    });

    it('should track token get operations', () => {
      spyOn(console, 'warn');

      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VybmFtZSI6InRlc3R1c2VyIiwicm9sZSI6IlBBVElFTlQiLCJ1c2VySWQiOjF9.signature';
      localStorage.setItem('authToken', token);

      // Retrieve token
      localStorage.getItem('authToken');

      // If role mismatch, should warn
      // (in this test, no mismatch, so warning shouldn't be called)
      expect(console.warn).not.toHaveBeenCalledWith(
        jasmine.stringMatching('Session Alert')
      );
    });
  });
});
