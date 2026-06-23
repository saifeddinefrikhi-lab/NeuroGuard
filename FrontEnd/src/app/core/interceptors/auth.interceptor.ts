import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service'; // adjust path

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private auth: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const isPublicAuthRequest = req.url.includes('/auth/login') || req.url.includes('/auth/register');

    if (isPublicAuthRequest) {
      return next.handle(req);
    }

    const token = this.auth.getToken(); // reads from localStorage

    if (token) {
      try {
        // Decode to extract role and userId for logging
        const payloadPart = token.split('.')[1];
        const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
        const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
        const payload = JSON.parse(atob(padded));

        // Attach the token with Bearer scheme
        req = req.clone({
          setHeaders: {
            Authorization: `Bearer ${token}`
          }
        });

        console.group(`[AuthInterceptor] Request: ${req.method} ${req.url.replace(/.*\/\/[^\/]+/, '')}`);
        console.log('Role:', payload.role);
        console.log('UserId:', payload.userId);
        console.groupEnd();
      } catch (e) {
        // Token exists but is malformed - don't send it
        console.error('[AuthInterceptor] Token decode failed, request will not be authorized:', e);
      }
    } else {
      console.warn('[AuthInterceptor] No token found for request:', req.url);
    }

    return next.handle(req);
  }
}