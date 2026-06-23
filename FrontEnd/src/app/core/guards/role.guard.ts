import { Injectable } from '@angular/core';
import { Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class RoleGuard {
    constructor(private authService: AuthService, private router: Router) {}

    canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
        const currentUser = this.authService.currentUser;
        
        if (!currentUser) {
            this.router.navigate(['/login']);
            return false;
        }

        // The expected role is passed via the route's data property
        const expectedRole = route.data['role'];
        if (expectedRole && currentUser.role !== expectedRole && currentUser.role !== 'admin') {
            // Logged in, but wrong role. Force them to their role's home
            this.router.navigate([`/${currentUser.role}/home`]);
            return false;
        }

        return true;
    }
}
