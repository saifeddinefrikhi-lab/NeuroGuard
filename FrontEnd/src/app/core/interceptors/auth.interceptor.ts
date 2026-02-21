import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service'; // adjust path

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.auth.getToken(); // reads from localStorage
    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('[AuthInterceptor] Added token to request:', req.url);
      console.log('[AuthInterceptor] Token (first 20 chars):', token.substring(0, 20) + '...');
      
      // Decode and log role for debugging
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        console.log('[AuthInterceptor] Token role:', payload.role);
      } catch (e) {
        console.error('[AuthInterceptor] Failed to decode token');
      }
    } else {
      console.warn('[AuthInterceptor] No token found for request:', req.url);
    }
    return next.handle(req);
  }
}