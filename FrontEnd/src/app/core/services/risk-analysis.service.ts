import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError } from 'rxjs';
import { RiskAnalysisReport, PrescriptionRiskScore } from '../models/risk-analysis.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RiskAnalysisService {

  constructor(private http: HttpClient) { }

  /**
   * Get comprehensive risk analysis report for all prescriptions
   * Only accessible to ADMIN and PROVIDER roles
   */
  getRiskAnalysisReport(patientId?: number): Observable<RiskAnalysisReport> {
    const url = `${environment.apiUrl}/api/prescriptions/risk/analysis`;
    const params = patientId != null ? { patientId: patientId.toString() } : undefined;
    console.log(`📊 Fetching risk analysis from: ${url}`, params ? `for patientId=${patientId}` : 'for all patients');
    
    return this.http.get<RiskAnalysisReport>(url, { params }).pipe(
      catchError(error => {
        console.error('❌ Error fetching risk analysis:', error);
        throw error;
      })
    );
  }

  /**
   * Get risk score for specific prescription
   * Accessible to ADMIN, PROVIDER, PATIENT, and CAREGIVER
   */
  getPrescriptionRiskScore(prescriptionId: number): Observable<PrescriptionRiskScore> {
    const url = `${environment.apiUrl}/api/prescriptions/risk/${prescriptionId}`;
    console.log(`📋 Fetching risk score for prescription ${prescriptionId}`);
    
    return this.http.get<PrescriptionRiskScore>(url).pipe(
      catchError(error => {
        console.error(`❌ Error fetching risk score for prescription ${prescriptionId}:`, error);
        throw error;
      })
    );
  }
}
