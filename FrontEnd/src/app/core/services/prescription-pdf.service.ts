import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionPdfService {
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
      msg = 'Connexion impossible. Vérifiez : Gateway, Eureka, prescription-service.';
    } else if (error.error?.message) msg = error.error.message;
    console.error('[PrescriptionPdfService]', msg, error);
    return throwError(() => new Error(msg));
  }

  /**
   * Télécharger une prescription en PDF
   * @param prescriptionId - ID de la prescription
   */
  downloadPrescriptionPdf(prescriptionId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/api/prescriptions/${prescriptionId}/pdf`, {
      responseType: 'blob'
    }).pipe(
      catchError(err => this.handleError(err))
    );
  }

  /**
   * Télécharger un document combiné (Plan de soins + Prescription)
   * @param prescriptionId - ID de la prescription
   * @param carePlanId - ID du plan de soins
   */
  downloadCombinedPdf(prescriptionId: number, carePlanId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/api/prescriptions/${prescriptionId}/combined-pdf/${carePlanId}`, {
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
