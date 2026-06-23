export interface PrescriptionRiskScore {
  prescriptionId: number;
  overallRiskScore: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  dosageRiskScore: number;
  frequencyRiskScore: number;
  complexityRiskScore: number;
  patternRiskScore: number;
  dosage: string;
  frequency: string;
  patientName: string;
  providerName: string;
  primaryRecommendation: string;
  secondaryRecommendation: string;
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  percentileRank: number;
  requiresImmediateReview: boolean;
}

export interface RiskAnalysisReport {
  totalAnalyzed: number;
  criticalCount: number;
  highRiskCount: number;
  mediumRiskCount: number;
  lowRiskCount: number;
  averageRiskScore: number;
  maxRiskScore: number;
  minRiskScore: number;
  prescriptionScores: PrescriptionRiskScore[];
  systemRecommendations: string[];
  overallHealthAssessment: string;
  riskTrend: 'INCREASING' | 'STABLE' | 'DECREASING';
  riskChangePercent: number;
  topConcerns: string[];
}
