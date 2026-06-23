import { HttpErrorResponse } from '@angular/common/http';

/**
 * Maps Angular HttpClient errors to a user-visible string (Spring Boot JSON, validation, network).
 */
export function parseHttpError(err: unknown, fallback: string): string {
  if (!(err instanceof HttpErrorResponse)) {
    return fallback;
  }

  if (err.status === 0) {
    return 'Network error: start the gateway (8083) and product-order-service (8095), or set apiUrl to http://localhost:8095';
  }
  if (err.status === 404) {
    return 'Not Found (404): gateway must route /products, /orders, and /deliveries to product-order-service on port 8095';
  }
  if (err.status === 502 || err.status === 503) {
    return 'Service unavailable (502/503): make sure the required backend service is running and registered in Eureka.';
  }

  const body = err.error;
  if (typeof body === 'string' && body.trim()) {
    return body.length > 200 ? body.slice(0, 200) + '…' : body;
  }
  if (body && typeof body === 'object') {
    const rec = body as Record<string, unknown>;
    if (typeof rec['error'] === 'string') {
      return rec['error'] as string;
    }
    if (typeof rec['message'] === 'string') {
      return rec['message'] as string;
    }
  }
  return err.message || fallback;
}
