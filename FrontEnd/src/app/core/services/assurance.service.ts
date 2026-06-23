import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface AssuranceRequest {
  patientId: number;
  providerName: string;
  policyNumber: string;
  coverageDetails: string;
  illness: string;
  postalCode: string;
  mobilePhone: string;
}

export interface UserDto {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
}

export interface AssuranceResponse {
  id: number;
  patientId: number;
  patientDetails?: UserDto;
  providerName: string;
  policyNumber: string;
  coverageDetails: string;
  illness: string;
  postalCode: string;
  mobilePhone: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssuranceService {
  private apiUrl = 'http://localhost:8083/api/assurances'; // Using Gateway

  constructor(private http: HttpClient) {}

  createAssurance(request: AssuranceRequest): Observable<AssuranceResponse> {
    return this.http.post<AssuranceResponse>(this.apiUrl, request);
  }

  getAssurancesByPatient(patientId: number): Observable<AssuranceResponse[]> {
    return this.http.get<AssuranceResponse[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getAllAssurances(): Observable<AssuranceResponse[]> {
    return this.http.get<AssuranceResponse[]>(this.apiUrl);
  }

  updateAssuranceStatus(id: number, status: string): Observable<AssuranceResponse> {
    return this.http.put<AssuranceResponse>(`${this.apiUrl}/${id}/status?status=${status}`, {});
  }

  getAssuranceById(id: number): Observable<AssuranceResponse> {
    return this.http.get<AssuranceResponse>(`${this.apiUrl}/${id}`);
  }

  updateAssurance(id: number, request: AssuranceRequest): Observable<AssuranceResponse> {
    return this.http.put<AssuranceResponse>(`${this.apiUrl}/${id}`, request);
  }

  deleteAssurance(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Download individual assurance PDF report
   */
  downloadAssurancePDF(id: number): Observable<Blob> {
    return this.http.get(`${this.apiUrl}/${id}/report/pdf`, { responseType: 'blob' });
  }

  /**
   * Bulk export multiple assurances as PDF
   */
  bulkExportAssurancePDF(ids: number[]): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/reports/bulk-export`, ids, { responseType: 'blob' });
  }

  // Simulation & Optimization Methods
  private simUrl = 'http://localhost:8083/api/simulations';

  simulateProcedure(patientId: number, procedureName: string): Observable<any> {
    return this.http.get<any>(`${this.simUrl}/procedure?patientId=${patientId}&procedureName=${procedureName}`);
  }

  getRentabilityAnalysis(patientId: number): Observable<any> {
    return this.http.get<any>(`${this.simUrl}/rentability/${patientId}`);
  }
}

