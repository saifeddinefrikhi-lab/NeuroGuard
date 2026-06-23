import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import {
  CarePlanResponse,
  CarePlanRequest,
  CarePlanSection,
  CarePlanMessageResponse,
  CarePlanMessageRequest,
  CarePlanStatsResponse
} from '../models/care-plan.model';
import { UserDto } from '../models/user.dto';

@Injectable({
  providedIn: 'root'
})
export class CarePlanService {
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
      msg = 'Connexion impossible. Vérifiez : Gateway http://localhost:8083, ouvrir l\'app en http://localhost:4200, et F12 (Console) pour CORS/réseau.';
    }
    else if (error.error?.message) msg = error.error.message;
    console.error('[CarePlanService]', msg, error);
    return throwError(() => new Error(msg));
  }

  getList(): Observable<CarePlanResponse[]> {
    return this.http.get<CarePlanResponse[]>(`${this.apiUrl}/api/care-plans/list`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getByPatientId(patientId: number): Observable<CarePlanResponse[]> {
    return this.http.get<CarePlanResponse[]>(`${this.apiUrl}/api/care-plans`, {
      params: { patientId: patientId.toString() }
    }).pipe(
      catchError(err => this.handleError(err))
    );
  }

  getById(id: number): Observable<CarePlanResponse> {
    return this.http.get<CarePlanResponse>(`${this.apiUrl}/api/care-plans/${id}`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  create(request: CarePlanRequest): Observable<CarePlanResponse> {
    return this.http.post<CarePlanResponse>(`${this.apiUrl}/api/care-plans`, request).pipe(
      catchError(err => this.handleError(err))
    );
  }

  update(id: number, request: CarePlanRequest): Observable<CarePlanResponse> {
    return this.http.put<CarePlanResponse>(`${this.apiUrl}/api/care-plans/${id}`, request).pipe(
      catchError(err => this.handleError(err))
    );
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/api/care-plans/${id}`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  /** Patient only: update one section's status (nutrition, sleep, activity, medication). */
  updateSectionStatus(id: number, section: CarePlanSection, status: 'TODO' | 'DONE'): Observable<CarePlanResponse> {
    return this.http.patch<CarePlanResponse>(`${this.apiUrl}/api/care-plans/${id}/status`, { section, status }).pipe(
      catchError(err => this.handleError(err))
    );
  }

  /** Get chat messages between doctor and patient for this care plan. */
  getMessages(planId: number): Observable<CarePlanMessageResponse[]> {
    return this.http.get<CarePlanMessageResponse[]>(`${this.apiUrl}/api/care-plans/${planId}/messages`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  /** Send a message (doctor or patient only). */
  sendMessage(planId: number, request: CarePlanMessageRequest): Observable<CarePlanMessageResponse> {
    return this.http.post<CarePlanMessageResponse>(`${this.apiUrl}/api/care-plans/${planId}/messages`, request).pipe(
      catchError(err => this.handleError(err))
    );
  }

  /** Admin only: care plan statistics. */
  getStats(): Observable<CarePlanStatsResponse> {
    return this.http.get<CarePlanStatsResponse>(`${this.apiUrl}/api/care-plans/stats`).pipe(
      catchError(err => this.handleError(err))
    );
  }

  /** Télécharger un plan de soins en PDF. */
  downloadPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/api/care-plans/${id}/pdf`, {
      responseType: 'blob'
    }).pipe(
      catchError(err => this.handleError(err))
    );
  }
}
