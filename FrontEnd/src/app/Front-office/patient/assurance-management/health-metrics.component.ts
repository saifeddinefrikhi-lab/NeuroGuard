import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

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

@Component({
  selector: 'app-health-metrics',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="health-metrics-container" *ngIf="assessment">
      <!-- Header Section -->
      <div class="metrics-header">
        <h2>Health Risk Assessment</h2>
        <p class="last-updated">
          Last assessed: {{ assessment.lastAssessmentDate | date:'short' }}
        </p>
      </div>

      <!-- Risk Score Cards -->
      <div class="risk-scores-grid">
        <!-- Complexity Score -->
        <div class="metric-card complexity-card">
          <div class="card-title">Medical Complexity</div>
          <div class="score-display">
            <div class="score-number" [ngClass]="getComplexityColor()">
              {{ assessment.medicalComplexityScore }}<span class="score-max">/100</span>
            </div>
            <div class="score-label">{{ assessment.riskStratum }}</div>
          </div>
          <div class="card-description">
            Overall health complexity based on multiple factors
          </div>
        </div>

        <!-- Alzheimer's Risk -->
        <div class="metric-card alzheimers-card">
          <div class="card-title">Alzheimer's Risk</div>
          <div class="score-display">
            <div class="score-number" [ngClass]="getAlzheimersColor()">
              {{ (assessment.alzheimersPredictionScore * 100).toFixed(0) }}<span class="score-max">%</span>
            </div>
            <div class="score-label">{{ assessment.alzheimersPredictionLevel }}</div>
          </div>
          <div class="card-description">
            ML-based neurological risk prediction
          </div>
        </div>

        <!-- Active Alerts -->
        <div class="metric-card alerts-card">
          <div class="card-title">Active Alerts</div>
          <div class="score-display">
            <div class="score-number alert-critical" *ngIf="assessment.highestAlertSeverity === 'CRITICAL'">
              {{ assessment.activeAlertCount }}
            </div>
            <div class="score-number alert-warning" *ngIf="assessment.highestAlertSeverity === 'WARNING'">
              {{ assessment.activeAlertCount }}
            </div>
            <div class="score-number alert-info" *ngIf="assessment.highestAlertSeverity === 'INFO'">
              {{ assessment.activeAlertCount }}
            </div>
            <div class="score-label">{{ assessment.highestAlertSeverity }}</div>
          </div>
          <div class="card-description">
            Clinical alerts requiring attention
          </div>
        </div>

        <!-- Annual Cost Estimate -->
        <div class="metric-card cost-card">
          <div class="card-title">Est. Annual Cost</div>
          <div class="score-display">
            <div class="score-number cost-value">
              \${{ (assessment.estimatedAnnualClaimCost / 1000).toFixed(1) }}<span class="score-max">K</span>
            </div>
            <div class="score-label">Predicted Claims</div>
          </div>
          <div class="card-description">
            Estimated healthcare costs for next 12 months
          </div>
        </div>
      </div>

      <!-- Coverage Recommendation -->
      <div class="coverage-section">
        <h3>Coverage Recommendation</h3>
        <div class="coverage-box" [ngClass]="getCoverageClass()">
          <div class="coverage-level">{{ assessment.recommendedCoverageLevel }}</div>
          <div class="coverage-description">
            <p>
              Based on your medical profile and risk factors, we recommend
              <strong>{{ assessment.recommendedCoverageLevel }}</strong> coverage level.
            </p>
          </div>
        </div>
      </div>

      <!-- Care Team Recommendation -->
      <div class="care-team-section">
        <h3>Care Team Optimization</h3>
        <div class="care-team-card">
          <div class="team-info">
            <div class="team-size">
              <div class="team-icon">👥</div>
              <div class="team-details">
                <div class="team-label">Recommended Providers</div>
                <div class="team-value">{{ assessment.recommendedProviderCount }} specialists</div>
              </div>
            </div>
          </div>
          <div class="referrals">
            <div class="referral-item" *ngIf="assessment.neurologyReferralNeeded">
              <span class="referral-badge">⚠️</span>
              <span>Neurology referral needed</span>
            </div>
            <div class="referral-item" *ngIf="assessment.geriatricAssessmentNeeded">
              <span class="referral-badge">⚠️</span>
              <span>Geriatric assessment recommended</span>
            </div>
            <div class="referral-item" *ngIf="!assessment.neurologyReferralNeeded && !assessment.geriatricAssessmentNeeded">
              <span class="referral-badge">✓</span>
              <span>No additional referrals needed</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Recommended Procedures -->
      <div class="procedures-section" *ngIf="assessment.recommendedProcedures && assessment.recommendedProcedures.length > 0">
        <h3>Recommended Procedures</h3>
        <div class="procedures-list">
          <div class="procedure-item" *ngFor="let procedure of assessment.recommendedProcedures">
            <span class="procedure-icon">📋</span>
            <span>{{ procedure }}</span>
          </div>
        </div>
      </div>

      <!-- Next Assessment Schedule -->
      <div class="next-assessment-section">
        <h3>Assessment Schedule</h3>
        <div class="assessment-info">
          <div class="assessment-item">
            <span class="label">Next Assessment Due:</span>
            <span class="value">{{ assessment.nextRecommendedAssessmentDate | date:'medium' }}</span>
          </div>
          <div class="assessment-item">
            <span class="label">Assessment Frequency:</span>
            <span class="value">{{ getAssessmentFrequency() }}</span>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .health-metrics-container {
      padding: 20px;
      background: #f8f9fa;
      border-radius: 8px;
    }

    .metrics-header {
      margin-bottom: 30px;
    }

    .metrics-header h2 {
      margin: 0 0 5px 0;
      color: #333;
      font-size: 24px;
    }

    .last-updated {
      color: #666;
      font-size: 12px;
      margin: 0;
    }

    .risk-scores-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 20px;
      margin-bottom: 30px;
    }

    .metric-card {
      background: white;
      border-radius: 8px;
      padding: 20px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border-left: 4px solid #ccc;
    }

    .complexity-card {
      border-left-color: #007bff;
    }

    .alzheimers-card {
      border-left-color: #dc3545;
    }

    .alerts-card {
      border-left-color: #ffc107;
    }

    .cost-card {
      border-left-color: #28a745;
    }

    .card-title {
      font-size: 12px;
      color: #999;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 10px;
    }

    .score-display {
      margin-bottom: 15px;
    }

    .score-number {
      font-size: 36px;
      font-weight: bold;
      margin-bottom: 5px;
      display: inline-block;
    }

    .score-max {
      font-size: 18px;
      font-weight: normal;
      margin-left: 2px;
    }

    .score-number.very-high-color { color: #dc3545; }
    .score-number.high-color { color: #fd7e14; }
    .score-number.moderate-color { color: #ffc107; }
    .score-number.low-color { color: #28a745; }

    .alert-critical { color: #dc3545; }
    .alert-warning { color: #ffc107; }
    .alert-info { color: #17a2b8; }

    .cost-value { color: #28a745; }

    .score-label {
      font-size: 14px;
      color: #666;
      margin-bottom: 10px;
    }

    .card-description {
      font-size: 13px;
      color: #999;
    }

    .coverage-section,
    .care-team-section,
    .procedures-section,
    .next-assessment-section {
      margin-bottom: 30px;
    }

    h3 {
      margin: 0 0 15px 0;
      color: #333;
      font-size: 16px;
    }

    .coverage-box {
      background: white;
      padding: 20px;
      border-radius: 8px;
      border-left: 4px solid #ccc;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .coverage-box.basic { border-left-color: #28a745; }
    .coverage-box.enhanced { border-left-color: #17a2b8; }
    .coverage-box.comprehensive { border-left-color: #007bff; }
    .coverage-box.intensive { border-left-color: #dc3545; }

    .coverage-level {
      font-size: 20px;
      font-weight: bold;
      color: #333;
      margin-bottom: 10px;
    }

    .coverage-description p {
      margin: 0;
      color: #666;
      font-size: 14px;
    }

    .care-team-card {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .team-info {
      margin-bottom: 20px;
      padding-bottom: 20px;
      border-bottom: 1px solid #eee;
    }

    .team-size {
      display: flex;
      align-items: center;
    }

    .team-icon {
      font-size: 32px;
      margin-right: 15px;
    }

    .team-label {
      font-size: 12px;
      color: #999;
      text-transform: uppercase;
    }

    .team-value {
      font-size: 18px;
      font-weight: bold;
      color: #333;
    }

    .referrals {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .referral-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px;
      background: #f8f9fa;
      border-radius: 4px;
      font-size: 14px;
      color: #666;
    }

    .referral-badge {
      font-size: 16px;
    }

    .procedures-list {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .procedure-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px;
      background: white;
      border-left: 3px solid #007bff;
      border-radius: 4px;
      font-size: 14px;
      color: #333;
      box-shadow: 0 1px 2px rgba(0,0,0,0.05);
    }

    .procedure-icon {
      font-size: 18px;
    }

    .assessment-info {
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    }

    .assessment-item {
      display: flex;
      justify-content: space-between;
      padding: 10px 0;
      border-bottom: 1px solid #eee;
      font-size: 14px;
    }

    .assessment-item:last-child {
      border-bottom: none;
    }

    .assessment-item .label {
      color: #666;
      font-weight: 500;
    }

    .assessment-item .value {
      color: #333;
      font-weight: bold;
    }

    @media (max-width: 768px) {
      .risk-scores-grid {
        grid-template-columns: 1fr;
      }

      .score-number {
        font-size: 28px;
      }
    }
  `]
})
export class HealthMetricsComponent implements OnInit {
  @Input() assessment: CoverageRiskAssessment | null = null;

  ngOnInit() {
    if (!this.assessment) {
      console.warn('HealthMetricsComponent: No assessment data provided');
    }
  }

  getComplexityColor(): string {
    if (this.assessment === null) return '';
    const score = this.assessment.medicalComplexityScore;
    if (score >= 80) return 'very-high-color';
    if (score >= 60) return 'high-color';
    if (score >= 40) return 'moderate-color';
    return 'low-color';
  }

  getAlzheimersColor(): string {
    if (this.assessment === null) return '';
    const prob = this.assessment.alzheimersPredictionScore;
    if (prob >= 0.80) return 'very-high-color';
    if (prob >= 0.60) return 'high-color';
    if (prob >= 0.40) return 'moderate-color';
    return 'low-color';
  }

  getCoverageClass(): string {
    return (this.assessment?.recommendedCoverageLevel || 'BASIC').toLowerCase().replace('_', '-');
  }

  getAssessmentFrequency(): string {
    if (this.assessment === null) return '';
    switch (this.assessment.alzheimersPredictionLevel) {
      case 'CRITICAL':
      case 'HIGH':
        return 'Every 3 months';
      case 'MODERATE':
        return 'Every 6 months';
      default:
        return 'Annually';
    }
  }
}
