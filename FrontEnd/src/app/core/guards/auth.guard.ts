import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }

  // Check if route has required roles
  const requiredRoles = route.data['roles'] as string[];
  if (requiredRoles && authService.currentUser) {
    if (!requiredRoles.includes(authService.currentUser.role)) {
      // User doesn't have required role, redirect to restricted page
      router.navigate(['/restricted']);
      return false;
    }
  }

  return true;
};