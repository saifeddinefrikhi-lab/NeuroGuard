import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { MedicalHistoryResponse, MedicalHistoryRequest, FileDto } from '../models/medical-history.model';
import { UserDto } from '../models/user.dto';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class MedicalHistoryService {
  private apiUrl = environment.apiUrl; // points to gateway, e.g., http://localhost:8083

  constructor(
    private http: HttpClient,
    private authService: AuthService
  ) {}

  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'An error occurred';
    
    if (error.status === 400) {
      // Bad Request - extract backend error message if available
      if (error.error && typeof error.error === 'object') {
        if (error.error.message) {
          errorMessage = `Bad Request: ${error.error.message}`;
        } else if (error.error.error) {
          errorMessage = `Bad Request: ${error.error.error}`;
        } else {
          errorMessage = `Bad Request: Invalid data sent to server. ${JSON.stringify(error.error).substring(0, 100)}`;
        }
      } else {
        errorMessage = 'Bad Request: The data sent to the server is invalid.';
      }
    } else if (error.status === 403) {
      errorMessage = 'Access Forbidden: You do not have permission to access this resource.';
    } else if (error.status === 401) {
      errorMessage = 'Unauthorized: Please log in again.';
    } else if (error.status === 404) {
      errorMessage = 'Resource not found.';
    } else if (error.status === 503) {
      errorMessage = 'Service Unavailable: The Medical History Service is not running. Please start the medical-history-service on your backend.';
    } else if (error.status === 0) {
      errorMessage = 'CORS Error or Network Issue: Cannot connect to backend. Check: (1) Gateway is running on http://localhost:8083, (2) CORS is configured in your backend to allow http://localhost:4200, (3) Check browser console for CORS errors.';
    } else if (error.error instanceof ErrorEvent) {
      errorMessage = `Client Error: ${error.error.message}`;
    } else {
      errorMessage = `Error: ${error.status} - ${error.statusText || 'Unknown error'}`;
    }
    
    console.error(`[MedicalHistoryService Error] ${errorMessage}`, error);
    console.error('Full error response:', error.error);
    return throwError(() => new Error(errorMessage));
  }

  getPatients(): Observable<UserDto[]> {
    console.log('[MedicalHistoryService] Fetching patients from:', `${this.apiUrl}/api/provider/medical-history/patients`);
    return this.http.get<UserDto[]>(`${this.apiUrl}/api/provider/medical-history/patients`)
      .pipe(
        catchError(err => this.handleError(err))
      );
  }

  getCaregivers(): Observable<UserDto[]> {
    console.log('[MedicalHistoryService] Fetching caregivers from:', `${this.apiUrl}/api/provider/medical-history/caregivers`);
    return this.http.get<UserDto[]>(`${this.apiUrl}/api/provider/medical-history/caregivers`)
      .pipe(
        catchError(err => this.handleError(err))
      );
  }

  getProviders(): Observable<UserDto[]> {
    console.log('[MedicalHistoryService] Fetching providers from:', `${this.apiUrl}/api/provider/medical-history/providers`);
    return this.http.get<UserDto[]>(`${this.apiUrl}/api/provider/medical-history/providers`)
      .pipe(
        catchError(err => this.handleError(err))
      );
  }

  // Get all medical histories for the logged-in provider
  getAllForProvider(): Observable<MedicalHistoryResponse[]> {
    console.log('[MedicalHistoryService] Fetching all medical histories from:', `${this.apiUrl}/api/provider/medical-history`);
    return this.http.get<MedicalHistoryResponse[]>(`${this.apiUrl}/api/provider/medical-history`)
      .pipe(
        catchError(err => this.handleError(err))
      );
  }

  // Get a single medical history by patient ID
  getByPatientId(patientId: number): Observable<MedicalHistoryResponse> {
    console.log('[MedicalHistoryService] Fetching medical history for patient:', patientId);
    return this.http.get<MedicalHistoryResponse>(`${this.apiUrl}/api/provider/medical-history/${patientId}`)
      .pipe(
        catchError(err => this.handleError(err))
      );
  }

  // Create a new medical history
  create(request: MedicalHistoryRequest): Observable<MedicalHistoryResponse> {
    console.log('[MedicalHistoryService] Creating medical history:', request);
    return this.http.post<MedicalHistoryResponse>(`${this.apiUrl}/api/provider/medical-history`, request)
      .pipe(
        catchError(err => this.handleError(err))
      );
  }

  // Update an existing medical history (by patient ID)
  update(patientId: number, request: MedicalHistoryRequest): Observable<MedicalHistoryResponse> {
    console.log('[MedicalHistoryService] Updating medical history for patient:', patientId);
    return this.http.put<MedicalHistoryResponse>(`${this.apiUrl}/api/provider/medical-history/${patientId}`, request)
      .pipe(
        catchError(err => this.handleError(err))
      );
  }

  // Delete a medical history
  delete(patientId: number): Observable<void> {
    console.log('[MedicalHistoryService] Deleting medical history for patient:', patientId);
    return this.http.delete<void>(`${this.apiUrl}/api/provider/medical-history/${patientId}`)
      .pipe(
        catchError(err => this.handleError(err))
      );
  }

// Get patient's own medical history
getMyMedicalHistory(): Observable<MedicalHistoryResponse> {
  const url = `${this.apiUrl}/api/patient/medical-history/me`;
  console.log('[MedicalHistoryService] Fetching my medical history from:', url);
  return this.http.get<MedicalHistoryResponse>(url)
    .pipe(catchError(err => this.handleError(err)));
}

// Get patient's own files
getMyFiles(): Observable<FileDto[]> {
  const url = `${this.apiUrl}/api/patient/medical-history/me/files`;
  console.log('[MedicalHistoryService] Fetching my files from:', url);
  return this.http.get<FileDto[]>(url)
    .pipe(catchError(err => this.handleError(err)));
}

// Upload file to patient's own history
uploadFile(file: File): Observable<FileDto> {
  const url = `${this.apiUrl}/api/patient/medical-history/me/files`;
  console.log('[MedicalHistoryService] Uploading file to:', url);
  const formData = new FormData();
  formData.append('file', file);
  return this.http.post<FileDto>(url, formData)
    .pipe(catchError(err => this.handleError(err)));
}
  downloadFile(fileId: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/files/${fileId}`, {
      responseType: 'blob'
    }).pipe(
      catchError(err => this.handleError(err))
    );
  }

  // Delete file from patient's own medical history
  deleteMyFile(fileId: number): Observable<void> {
    const url = `${this.apiUrl}/api/patient/medical-history/me/files/${fileId}`;
    console.log('[MedicalHistoryService] Deleting my file:', url);
    return this.http.delete<void>(url)
      .pipe(catchError(err => this.handleError(err)));
  }

  // Delete file from patient's medical history (provider access)
  deletePatientFile(patientId: number, fileId: number): Observable<void> {
    const url = `${this.apiUrl}/api/provider/medical-history/${patientId}/files/${fileId}`;
    console.log('[MedicalHistoryService] Deleting patient file:', url);
    return this.http.delete<void>(url)
      .pipe(catchError(err => this.handleError(err)));
  }

  // Get list of patients assigned to this caregiver
getAssignedPatients(): Observable<UserDto[]> {
  const url = `${this.apiUrl}/api/caregiver/medical-history/patients`;
  console.log('[MedicalHistoryService] Fetching assigned patients from:', url);
  return this.http.get<UserDto[]>(url)
    .pipe(catchError(err => this.handleError(err)));
}

// Get a specific patient's medical history (for caregiver view)
getPatientHistoryForCaregiver(patientId: number): Observable<MedicalHistoryResponse> {
  const url = `${this.apiUrl}/api/caregiver/medical-history/${patientId}`;
  console.log('[MedicalHistoryService] Fetching patient history for caregiver:', url);
  return this.http.get<MedicalHistoryResponse>(url)
    .pipe(catchError(err => this.handleError(err)));
}
}