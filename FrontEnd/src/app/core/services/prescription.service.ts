import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  PrescriptionResponse,
  PrescriptionRequest
} from '../models/prescription.model';
import { UserDto } from '../models/user.dto';

@Injectable({
  providedIn: 'root'
})
export class PrescriptionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getPatients(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/users/role/PATIENT`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getProviders(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(`${this.apiUrl}/users/role/PROVIDER`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    let msg = 'An error occurred';
    if (error.status === 400 && error.error) {
      msg = typeof error.error === 'string' ? error.error : (error.error.message || JSON.stringify(error.error).slice(0, 150));
    } else if (error.status === 403) msg = 'Access forbidden.';
    else if (error.status === 401) msg = 'Please log in again.';
    else if (error.status === 404) msg = 'Resource not found.';
    else if (error.status === 0) {
      msg = 'Connexion impossible. Vérifiez : Gateway, Eureka, prescription-service (port 8089).';
    } else if (error.error?.message) msg = error.error.message;
    console.error('[PrescriptionService]', msg, error);
    return throwError(() => new Error(msg));
  }

  getList(): Observable<PrescriptionResponse[]> {
    return this.http.get<PrescriptionResponse[]>(`${this.apiUrl}/api/prescriptions/list`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  search(keyword: string): Observable<PrescriptionResponse[]> {
    return this.http.get<PrescriptionResponse[]>(`${this.apiUrl}/api/prescriptions/search`, {
      params: { keyword }
    }).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getByPatientId(patientId: number): Observable<PrescriptionResponse[]> {
    return this.http.get<PrescriptionResponse[]>(`${this.apiUrl}/api/prescriptions`, {
      params: { patientId: patientId.toString() }
    }).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getById(id: number): Observable<PrescriptionResponse> {
    return this.http.get<PrescriptionResponse>(`${this.apiUrl}/api/prescriptions/${id}`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  create(request: PrescriptionRequest): Observable<PrescriptionResponse> {
    return this.http.post<PrescriptionResponse>(`${this.apiUrl}/api/prescriptions`, request).pipe(
      catchError(err => this.handleError(err))
    );
  }

  update(id: number, request: PrescriptionRequest): Observable<PrescriptionResponse> {
    return this.http.put<PrescriptionResponse>(`${this.apiUrl}/api/prescriptions/${id}`, request).pipe(
      catchError(err => this.handleError(err))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/prescriptions/${id}`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  /** Télécharger une ordonnance en PDF. */
  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/api/prescriptions/${id}/pdf`, {
      responseType: 'blob'
    }).pipe(
      catchError(err => this.handleError(err))
    );
  }

  /** Télécharger le document combine (plan de soins + ordonnance). */
  downloadCombinedPdf(prescriptionId: number, carePlanId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/api/prescriptions/${prescriptionId}/combined-pdf/${carePlanId}`, {
      responseType: 'blob'
    }).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
