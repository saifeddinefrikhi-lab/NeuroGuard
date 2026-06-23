import { Component, OnInit, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectionStrategy, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RiskAnalysisService } from 'src/app/core/services/risk-analysis.service';
import { PrescriptionService } from 'src/app/core/services/prescription.service';
import { RiskAnalysisReport, PrescriptionRiskScore } from 'src/app/core/models/risk-analysis.model';
import { UserDto } from 'src/app/core/models/user.dto';

@Component({
  selector: 'app-risk-analysis',
  standalone: true,
  imports: [CommonModule],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="container-fluid mt-4">
      <!-- Header -->
      <div class="row mb-4">
        <div class="col-md-12">
          <h2 class="page-title">⚠️ Prescription Risk Analysis</h2>
          <p class="text-muted">Advanced risk scoring algorithm with automatic recommendations</p>
        </div>
      </div>

      <div class="row mb-3">
        <div class="col-md-4">
          <label for="patient-select" class="form-label">Choisir un patient</label>
          <select id="patient-select" class="form-select" (change)="onPatientSelected($event)">
            <option value="">Tous les patients</option>
            <option *ngFor="let patient of patients" [value]="patient.id">
              {{ patient.firstName }} {{ patient.lastName }} ({{ patient.id }})
            </option>
          </select>
        </div>
        <div class="col-md-8 d-flex align-items-end">
          <div class="text-muted">
            <small>Analyse affichée pour : <strong>{{ selectedPatientName }}</strong></small>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
        <p class="mt-3">Calculating risk scores...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="!loading && error" class="alert alert-danger" role="alert">
        <strong>Error:</strong> {{ error }}
      </div>

      <!-- Report Content -->
      <div *ngIf="!loading && report">
        
        <!-- Health Status Cards -->
        <div class="row mb-4">
          <!-- Overall Assessment -->
          <div class="col-md-12 mb-3">
            <div class="card health-assessment">
              <div class="card-body">
                <h5 class="card-title">Overall Health Assessment</h5>
                <p class="assessment-text" [ngClass]="getAssessmentClass()">
                  {{ report.overallHealthAssessment }}
                </p>
              </div>
            </div>
          </div>

          <!-- Risk Distribution -->
          <div class="col-md-6">
            <div class="card stat-card">
              <div class="card-header bg-danger text-white">
                <h6 class="mb-0">Critical Cases</h6>
              </div>
              <div class="card-body text-center">
                <h2 class="text-danger">{{ report.criticalCount }}</h2>
                <p class="text-muted">Requires Immediate Review</p>
              </div>
            </div>
          </div>

          <div class="col-md-6">
            <div class="card stat-card">
              <div class="card-header bg-warning text-dark">
                <h6 class="mb-0">Risk Trend</h6>
              </div>
              <div class="card-body text-center">
                <h4>
                  <span *ngIf="report.riskTrend === 'INCREASING'" class="text-danger">📈 INCREASING</span>
                  <span *ngIf="report.riskTrend === 'STABLE'" class="text-warning">➡️ STABLE</span>
                  <span *ngIf="report.riskTrend === 'DECREASING'" class="text-success">📉 DECREASING</span>
                </h4>
              </div>
            </div>
          </div>
        </div>

        <!-- Risk Summary Row -->
        <div class="row mb-4">
          <div class="col-md-3">
            <div class="risk-summary-card" style="border-left: 5px solid #dc3545;">
              <p class="label">🔴 HIGH RISK</p>
              <h3 class="text-danger">{{ report.highRiskCount }}</h3>
              <small class="text-muted">Prescriptions</small>
            </div>
          </div>
          <div class="col-md-3">
            <div class="risk-summary-card" style="border-left: 5px solid #ffc107;">
              <p class="label">🟡 MEDIUM RISK</p>
              <h3 class="text-warning">{{ report.mediumRiskCount }}</h3>
              <small class="text-muted">Prescriptions</small>
            </div>
          </div>
          <div class="col-md-3">
            <div class="risk-summary-card" style="border-left: 5px solid #28a745;">
              <p class="label">🟢 LOW RISK</p>
              <h3 class="text-success">{{ report.lowRiskCount }}</h3>
              <small class="text-muted">Prescriptions</small>
            </div>
          </div>
          <div class="col-md-3">
            <div class="risk-summary-card" style="border-left: 5px solid #17a2b8;">
              <p class="label">📊 AVERAGE SCORE</p>
              <h3 class="text-info">{{ report.averageRiskScore | number: '1.0-0' }}</h3>
              <small class="text-muted">Out of 100</small>
            </div>
          </div>
        </div>

        <!-- System Recommendations -->
        <div class="row mb-4">
          <div class="col-md-12">
            <div class="card">
              <div class="card-header bg-primary text-white">
                <h5 class="mb-0">🔔 System Recommendations</h5>
              </div>
              <div class="card-body">
                <ul class="list-unstyled">
                  <li *ngFor="let rec of report.systemRecommendations" class="mb-2">
                    <div class="alert alert-info mb-0">{{ rec }}</div>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        <!-- Top Concerns -->
        <div class="row mb-4" *ngIf="report.topConcerns && report.topConcerns.length > 0">
          <div class="col-md-12">
            <div class="card">
              <div class="card-header bg-danger text-white">
                <h5 class="mb-0">⚠️ Top Concerns</h5>
              </div>
              <div class="card-body">
                <ol>
                  <li *ngFor="let concern of report.topConcerns" class="mb-2">
                    {{ concern }}
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </div>

        <!-- High Risk Prescriptions Table -->
        <div class="row">
          <div class="col-md-12">
            <div class="card">
              <div class="card-header bg-dark text-white">
                <h5 class="mb-0">📋 High Risk Prescriptions (Top 20)</h5>
              </div>
              <div class="table-responsive">
                <table class="table table-hover mb-0">
                  <thead class="table-light">
                    <tr>
                      <th>Risk Score</th>
                      <th>Level</th>
                      <th>Urgency</th>
                      <th>Dosage Risk</th>
                      <th>Frequency Risk</th>
                      <th>Complexity</th>
                      <th>Recommendation</th>
                      <th>Review</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr *ngFor="let presc of report.prescriptionScores" [ngClass]="getRiskRowClass(presc.riskLevel)">
                      <td>
                        <strong>{{ presc.overallRiskScore }}/100</strong>
                      </td>
                      <td>
                        <span [ngClass]="'badge badge-' + getRiskBadgeClass(presc.riskLevel)">
                          {{ presc.riskLevel }}
                        </span>
                      </td>
                      <td>
                        <span [ngClass]="'badge badge-' + getUrgencyBadgeClass(presc.urgencyLevel)">
                          {{ presc.urgencyLevel }}
                        </span>
                      </td>
                      <td>{{ presc.dosageRiskScore }}/25</td>
                      <td>{{ presc.frequencyRiskScore }}/25</td>
                      <td>{{ presc.complexityRiskScore }}/25</td>
                      <td class="small">{{ presc.primaryRecommendation }}</td>
                      <td>
                        <span *ngIf="presc.requiresImmediateReview" class="badge bg-danger">URGENT</span>
                        <span *ngIf="!presc.requiresImmediateReview" class="badge bg-secondary">OK</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  `,
  styles: [`
    .page-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 0.5rem;
    }

    .health-assessment {
      border-left: 5px solid #007bff;
      background: linear-gradient(135deg, #f0f4ff 0%, #ffffff 100%);
    }

    .assessment-text {
      font-size: 1.1rem;
      font-weight: 500;
      margin: 0;
    }

    .stat-card {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      border: none;
    }

    .risk-summary-card {
      background: white;
      padding: 1.5rem;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      text-align: center;
    }

    .risk-summary-card .label {
      font-size: 0.85rem;
      color: #666;
      margin-bottom: 0.5rem;
    }

    .risk-summary-card h3 {
      font-weight: 600;
      margin: 0.5rem 0;
    }

    .table-hover tbody tr:hover {
      background-color: #f9f9f9;
    }

    .badge {
      padding: 0.5rem 0.75rem;
      font-size: 0.85rem;
      font-weight: 500;
    }

    .badge-danger {
      background-color: #dc3545 !important;
    }

    .badge-warning {
      background-color: #ffc107 !important;
      color: #333;
    }

    .badge-success {
      background-color: #28a745 !important;
    }

    .badge-info {
      background-color: #17a2b8 !important;
    }

    .card-header {
      padding: 1rem;
      font-weight: 600;
    }
  `]
})
export class RiskAnalysisComponent implements OnInit {
  report: RiskAnalysisReport | null = null;
  loading = true;
  error = '';
  patients: UserDto[] = [];
  selectedPatientId: number | null = null;
  selectedPatientName = 'Tous les patients';

  private riskService = inject(RiskAnalysisService);
  private prescriptionService = inject(PrescriptionService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit(): void {
    this.loadPatients();
    this.loadRiskAnalysis();
  }

  loadRiskAnalysis(patientId?: number | null): void {
    this.loading = true;
    this.error = '';

    this.riskService.getRiskAnalysisReport(patientId ?? undefined).subscribe({
      next: (data) => {
        this.report = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading risk analysis:', err);
        this.error = 'Failed to load risk analysis. Please try again.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  loadPatients(): void {
    this.prescriptionService.getPatients().subscribe({
      next: (patients) => {
        this.patients = patients;
      },
      error: (err) => {
        console.error('Error loading patient list:', err);
      }
    });
  }

  onPatientSelected(event: Event): void {
    const target = event.target as HTMLSelectElement;
    const patientId = target.value ? Number(target.value) : null;
    this.selectedPatientId = patientId;
    if (patientId != null) {
      const patient = this.patients.find(p => p.id === patientId);
      this.selectedPatientName = patient ? `${patient.firstName} ${patient.lastName}` : `Patient #${patientId}`;
    } else {
      this.selectedPatientName = 'Tous les patients';
    }
    this.loadRiskAnalysis(this.selectedPatientId);
  }

  getRiskRowClass(riskLevel: string): string {
    switch (riskLevel) {
      case 'HIGH':
        return 'table-danger';
      case 'MEDIUM':
        return 'table-warning';
      case 'LOW':
        return 'table-success';
      default:
        return '';
    }
  }

  getRiskBadgeClass(riskLevel: string): string {
    switch (riskLevel) {
      case 'HIGH':
        return 'danger';
      case 'MEDIUM':
        return 'warning';
      case 'LOW':
        return 'success';
      default:
        return 'secondary';
    }
  }

  getUrgencyBadgeClass(urgency: string): string {
    switch (urgency) {
      case 'CRITICAL':
        return 'danger';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      case 'LOW':
        return 'success';
      default:
        return 'secondary';
    }
  }

  getAssessmentClass(): string {
    if (!this.report) return '';
    if (this.report.overallHealthAssessment.includes('CRITIQUE')) return 'text-danger';
    if (this.report.overallHealthAssessment.includes('ATTENTION')) return 'text-warning';
    return 'text-success';
  }
}
