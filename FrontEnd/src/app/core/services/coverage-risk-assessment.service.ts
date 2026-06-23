import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface CoverageRiskAssessment {
  id: number;
  assuranceId: number;
  patientId: number;
  alzheimersPredictionScore: number;
  alzheimersPredictionLevel: string;
  activeAlertCount: number;
  highestAlertSeverity: string;
  alertSeverityRatio: number;
  medicalComplexityScore: number;
  recommendedCoverageLevel: string;
  estimatedAnnualClaimCost: number;
  recommendedProcedures: string[];
  recommendedProviderCount: number;
  neurologyReferralNeeded: boolean;
  geriatricAssessmentNeeded: boolean;
  lastAssessmentDate: string;
  nextRecommendedAssessmentDate: string;
  riskStratum: string;
  createdAt: string;
  updatedAt: string;
}

@Injectable({
  providedIn: 'root'
})
export class CoverageRiskAssessmentService {
  private apiUrl = `${environment.apiUrl}/api/assurances`;

  constructor(private http: HttpClient) {}

  /**
   * Generate a new coverage risk assessment
   */
  generateCoverageAssessment(assuranceId: number, patientId: number): Observable<CoverageRiskAssessment> {
    return this.http.post<CoverageRiskAssessment>(
      `${this.apiUrl}/${assuranceId}/risk-assessment?patientId=${patientId}`,
      {}
    );
  }

  /**
   * Get existing coverage risk assessment
   */
  getRiskAssessment(assuranceId: number): Observable<CoverageRiskAssessment> {
    return this.http.get<CoverageRiskAssessment>(
      `${this.apiUrl}/${assuranceId}/risk-assessment`
    );
  }

  /**
   * Refresh/recalculate an existing assessment
   */
  refreshRiskAssessment(assuranceId: number, patientId: number): Observable<CoverageRiskAssessment> {
    return this.http.put<CoverageRiskAssessment>(
      `${this.apiUrl}/${assuranceId}/risk-assessment/refresh?patientId=${patientId}`,
      {}
    );
  }
}
