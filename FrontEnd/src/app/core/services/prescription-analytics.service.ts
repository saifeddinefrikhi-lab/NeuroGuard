import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SimpleStats } from '../models/simple-stats.model';

export interface DosageAnalytics {
  dosage: string;
  count: number;
  percentage: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
}

export interface FrequencyAnalytics {
  frequency: string;
  count: number;
  percentage: number;
  totalDosesPerMonth: number;
  complianceRisk: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface PrescriptionAnalytics {
  totalPrescriptions: number;
  totalPatients: number;
  totalProviders: number;
  averageDosageComplexity: number;
  averageFrequencyComplexity: number;
  dosageAnalysis: DosageAnalytics[];
  highRiskDosageCount: number;
  topDosage: string;
  frequencyAnalysis: FrequencyAnalytics[];
  highComplianceRiskCount: number;
  mostCommonFrequency: string;
  prescriptionsRequiringReview: number;
  recommendations: string[];
  averagePrescriptionsPerPatient: number;
  prescriptionsWithComplexity: number;
}

@Injectable({
  providedIn: 'root'
})
export class PrescriptionAnalyticsService {

  constructor(private http: HttpClient) { }

  getGlobalAnalytics(): Observable<PrescriptionAnalytics> {
    return this.http.get<PrescriptionAnalytics>(
      '/api/prescriptions/analytics/global'
    );
  }

  getSimpleStats(): Observable<SimpleStats> {
    return this.http.get<SimpleStats>(
      '/api/prescriptions/analytics/stats'
    );
  }
}
