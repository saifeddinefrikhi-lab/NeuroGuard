import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CarePlanPdfService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  private handleError(error: HttpErrorResponse): Observable<never> {
    let msg = 'An error occurred';
    if (error.status === 400 && error.error) {
      msg = typeof error.error === 'string' ? error.error : (error.error.message || JSON.stringify(error.error).slice(0, 150));
    } else if (error.status === 403) msg = 'Access forbidden.';
    else if (error.status === 401) msg = 'Please log in again.';
    else if (error.status === 404) msg = 'Resource not found.';
    else if (error.status === 0) {
      msg = 'Connexion impossible. Vérifiez : Gateway, Eureka, careplan-service.';
    } else if (error.error?.message) msg = error.error.message;
    console.error('[CarePlanPdfService]', msg, error);
    return throwError(() => new Error(msg));
  }

  /**
   * Télécharger un plan de soins en PDF
   * @param carePlanId - ID du plan de soins
   */
  downloadCarePlanPdf(carePlanId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/api/care-plans/${carePlanId}/pdf`, {
      responseType: 'blob'
    }).pipe(
      catchError(err => this.handleError(err))
    );
  }

  /**
   * Helper function pour télécharger/sauvegarder un Blob en tant que fichier
   * @param blob - Le blob à télécharger
   * @param filename - Le nom du fichier
   */
  downloadBlob(blob: Blob, filename: string): void {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    window.URL.revokeObjectURL(url);
  }
}
