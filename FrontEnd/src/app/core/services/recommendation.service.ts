import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface CarePlanRecommendation {
  cluster: number;
  confidence: number;
  carePlan: {
    profile: string;
    description: string;
    medicalFollowUp: string;
    physicalActivity: string;
    nutrition: string;
    medication: string;
    additionalNotes: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RecommendationService {
  private apiUrl = environment.apiUrl; // e.g., http://localhost:8083

  constructor(private http: HttpClient) {}

  predictCarePlan(patientData: any): Observable<CarePlanRecommendation> {
    const url = `${this.apiUrl}/api/recommendation/predict`;
    return this.http.post<CarePlanRecommendation>(url, patientData)
      .pipe(catchError(this.handleError));
  }

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    if (error.error instanceof ErrorEvent) {
      // Client-side error
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Server-side error
      if (error.status === 503) {
        errorMessage = 'ML Service Unavailable. Please ensure the Python recommendation-service is running.';
      } else {
        errorMessage = `Error Code: ${error.status}\nMessage: ${error.message}`;
      }
    }
    console.error('[RecommendationService Error]', errorMessage, error);
    return throwError(() => new Error(errorMessage));
  }
}
