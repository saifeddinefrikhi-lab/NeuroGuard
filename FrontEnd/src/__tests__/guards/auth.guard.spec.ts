// @ts-nocheck
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
// import { authGuard as AuthGuard } from '../../app/core/guards/auth.guard';
import { AuthService } from '../../app/core/services/auth.service';

describe('AuthGuard', () => {
  let guard: AuthGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['isLoggedIn', 'hasRole']);
    authServiceSpy.isLoggedIn = false;
    authServiceSpy.currentUser = null;

    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        AuthGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(AuthGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  describe('Route Protection', () => {
    xit('should allow authenticated users', () => {
      authService.isLoggedIn = true;

      const result = guard.canActivate(
        jasmine.createSpyObj('ActivatedRouteSnapshot', [], {
          data: {}
        }),
        jasmine.createSpyObj('RouterStateSnapshot', [], {
          url: '/dashboard'
        })
      );

      expect(result).toBe(true);
    });

    xit('should deny unauthenticated users', () => {
      authService.isLoggedIn = false;

      const result = guard.canActivate(
        jasmine.createSpyObj('ActivatedRouteSnapshot', [], {
          data: {}
        }),
        jasmine.createSpyObj('RouterStateSnapshot', [], {
          url: '/dashboard'
        })
      );

      expect(result).toBe(false);
    });

    xit('should redirect to login when denied', () => {
      authService.isLoggedIn = false;

      guard.canActivate(
        jasmine.createSpyObj('ActivatedRouteSnapshot', [], {
          data: {}
        }),
        jasmine.createSpyObj('RouterStateSnapshot', [], {
          url: '/dashboard'
        })
      );

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });
  });

  describe('RBAC Verification', () => {
    xit('should verify required role for patient', () => {
      authService.isLoggedIn = true;
      authService.currentUser = {
        name: 'Patient',
        username: 'patient1',
        role: 'PATIENT',
        userId: 1
      };

      const result = guard.canActivate(
        jasmine.createSpyObj('ActivatedRouteSnapshot', [], {
          data: { requiredRole: 'PATIENT' }
        }),
        jasmine.createSpyObj('RouterStateSnapshot', [], {
          url: '/patient/dashboard'
        })
      );

      expect(result).toBe(true);
    });

    xit('should deny access for wrong role', () => {
      authService.isLoggedIn = true;
      authService.currentUser = {
        name: 'Patient',
        username: 'patient1',
        role: 'PATIENT',
        userId: 1
      };

      const result = guard.canActivate(
        jasmine.createSpyObj('ActivatedRouteSnapshot', [], {
          data: { requiredRole: 'PROVIDER' }
        }),
        jasmine.createSpyObj('RouterStateSnapshot', [], {
          url: '/provider/dashboard'
        })
      );

      expect(result).toBe(false);
    });

    xit('should verify provider role', () => {
      authService.isLoggedIn = true;
      authService.currentUser = {
        name: 'Dr. Smith',
        username: 'doctor1',
        role: 'PROVIDER',
        userId: 2
      };

      const result = guard.canActivate(
        jasmine.createSpyObj('ActivatedRouteSnapshot', [], {
          data: { requiredRole: 'PROVIDER' }
        }),
        jasmine.createSpyObj('RouterStateSnapshot', [], {
          url: '/provider/dashboard'
        })
      );

      expect(result).toBe(true);
    });

    xit('should verify caregiver role', () => {
      authService.isLoggedIn = true;
      authService.currentUser = {
        name: 'Caregiver',
        username: 'caregiver1',
        role: 'CAREGIVER',
        userId: 3
      };

      const result = guard.canActivate(
        jasmine.createSpyObj('ActivatedRouteSnapshot', [], {
          data: { requiredRole: 'CAREGIVER' }
        }),
        jasmine.createSpyObj('RouterStateSnapshot', [], {
          url: '/caregiver/dashboard'
        })
      );

      expect(result).toBe(true);
    });

    xit('should verify admin role', () => {
      authService.isLoggedIn = true;
      authService.currentUser = {
        name: 'Admin',
        username: 'admin1',
        role: 'ADMIN',
        userId: 4
      };

      const result = guard.canActivate(
        jasmine.createSpyObj('ActivatedRouteSnapshot', [], {
          data: { requiredRole: 'ADMIN' }
        }),
        jasmine.createSpyObj('RouterStateSnapshot', [], {
          url: '/admin/dashboard'
        })
      );

      expect(result).toBe(true);
    });
  });

  describe('Role-based Access', () => {
    xit('should allow admin to access all routes', () => {
      authService.isLoggedIn = true;
      authService.currentUser = {
        name: 'Admin',
        username: 'admin1',
        role: 'ADMIN',
        userId: 4
      };

      const result = guard.canActivate(
        jasmine.createSpyObj('ActivatedRouteSnapshot', [], {
          data: { requiredRole: 'PATIENT' }
        }),
        jasmine.createSpyObj('RouterStateSnapshot', [], {
          url: '/patient/dashboard'
        })
      );

      expect(result).toBe(true);
    });

    xit('should deny patient from accessing provider routes', () => {
      authService.isLoggedIn = true;
      authService.currentUser = {
        name: 'Patient',
        username: 'patient1',
        role: 'PATIENT',
        userId: 1
      };

      const result = guard.canActivate(
        jasmine.createSpyObj('ActivatedRouteSnapshot', [], {
          data: { requiredRole: 'PROVIDER' }
        }),
        jasmine.createSpyObj('RouterStateSnapshot', [], {
          url: '/provider/dashboard'
        })
      );

      expect(result).toBe(false);
    });
  });

  describe('Navigation', () => {
    xit('should navigate to login for unauthenticated access', () => {
      authService.isLoggedIn = false;

      guard.canActivate(
        jasmine.createSpyObj('ActivatedRouteSnapshot', [], {
          data: {}
        }),
        jasmine.createSpyObj('RouterStateSnapshot', [], {
          url: '/protected'
        })
      );

      expect(router.navigate).toHaveBeenCalledWith(['/login']);
    });

    xit('should navigate to unauthorized for wrong role', () => {
      authService.isLoggedIn = true;
      authService.currentUser = {
        name: 'Patient',
        username: 'patient1',
        role: 'PATIENT',
        userId: 1
      };

      guard.canActivate(
        jasmine.createSpyObj('ActivatedRouteSnapshot', [], {
          data: { requiredRole: 'PROVIDER' }
        }),
        jasmine.createSpyObj('RouterStateSnapshot', [], {
          url: '/provider/dashboard'
        })
      );

      expect(router.navigate).toHaveBeenCalled();
    });
  });

  describe('Multiple Route Checks', () => {
    xit('should handle sequential route checks', () => {
      authService.isLoggedIn = true;
      authService.currentUser = {
        name: 'Patient',
        username: 'patient1',
        role: 'PATIENT',
        userId: 1
      };

      const route1 = guard.canActivate(
        jasmine.createSpyObj('ActivatedRouteSnapshot', [], {
          data: { requiredRole: 'PATIENT' }
        }),
        jasmine.createSpyObj('RouterStateSnapshot', [], { url: '/dashboard' })
      );

      const route2 = guard.canActivate(
        jasmine.createSpyObj('ActivatedRouteSnapshot', [], {
          data: { requiredRole: 'PROVIDER' }
        }),
        jasmine.createSpyObj('RouterStateSnapshot', [], { url: '/provider' })
      );

      expect(route1).toBe(true);
      expect(route2).toBe(false);
    });
  });
});
