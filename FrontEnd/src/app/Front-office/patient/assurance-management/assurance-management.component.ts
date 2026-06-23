import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { AssuranceService, AssuranceResponse } from '../../../core/services/assurance.service';
import { CoverageRiskAssessmentService, CoverageRiskAssessment } from '../../../core/services/coverage-risk-assessment.service';
import { HealthMetricsComponent } from './health-metrics.component';
import { AuthService } from '../../../core/services/auth.service';
import { SharedModule } from 'src/app/theme/shared/shared.module';
import { PatientRentabilityAnalysisComponent } from './patient-rentability-analysis.component';
import { PatientCoverageOptimizerComponent } from './patient-coverage-optimizer.component';

@Component({
  selector: 'app-assurance-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, SharedModule, HealthMetricsComponent, PatientRentabilityAnalysisComponent, PatientCoverageOptimizerComponent],
  templateUrl: './assurance-management.component.html',
  styleUrls: ['./assurance-management.component.scss']
})
export class AssuranceManagementComponent implements OnInit {
  assurances: AssuranceResponse[] = [];
  assuranceForm!: FormGroup;
  isSubmitting = false;
  showForm = false;
  isEditMode = false;
  editingId: number | null = null;
  showDeleteConfirm = false;
  deleteConfirmId: number | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Risk Assessment Properties
  selectedAssuranceId: number | null = null;
  selectedRiskAssessment: CoverageRiskAssessment | null = null;
  riskAssessmentLoading = false;
  showRiskAssessment = false;

  currentPatientId: number = 0;

  constructor(
    private fb: FormBuilder,
    private assuranceService: AssuranceService,
    private coverageRiskAssessmentService: CoverageRiskAssessmentService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentPatientId = this.authService.getCurrentUserId() ?? 0;
    this.initForm();
    this.loadAssurances();
  }

  initForm(): void {
    this.assuranceForm = this.fb.group({
      providerName: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      policyNumber: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
      coverageDetails: ['', [Validators.maxLength(500)]],
      illness: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(200)]],
      postalCode: ['', [Validators.required, Validators.pattern(/^[0-9]{5}$/), Validators.maxLength(10)]],
      mobilePhone: ['', [Validators.required, Validators.pattern(/^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/)]]
    });
  }

  loadAssurances(): void {
    if (!this.currentPatientId) {
      console.warn('[AssuranceManagement] No patient ID available, skipping load');
      return;
    }
    this.assuranceService.getAssurancesByPatient(this.currentPatientId).subscribe({
      next: (data) => {
        this.assurances = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading assurances', err);
        this.cdr.detectChanges();
      }
    });
  }

  toggleForm(): void {
    this.showForm = !this.showForm;
    if (!this.showForm) {
      this.assuranceForm.reset();
      this.isEditMode = false;
      this.editingId = null;
    }
  }

  editAssurance(assurance: AssuranceResponse): void {
    this.isEditMode = true;
    this.editingId = assurance.id;
    this.showForm = true;
    this.assuranceForm.patchValue({
      providerName: assurance.providerName,
      policyNumber: assurance.policyNumber,
      coverageDetails: assurance.coverageDetails,
      illness: assurance.illness,
      postalCode: assurance.postalCode,
      mobilePhone: assurance.mobilePhone
    });
    this.cdr.detectChanges();
  }

  onSubmit(): void {
    if (this.assuranceForm.invalid) return;

    this.isSubmitting = true;
    this.errorMessage = null;
    this.successMessage = null;

    const request = {
      patientId: this.currentPatientId,
      ...this.assuranceForm.value
    };

    if (this.isEditMode && this.editingId) {
      // Update existing assurance
      this.assuranceService.updateAssurance(this.editingId, request).subscribe({
        next: (res) => {
          const index = this.assurances.findIndex(a => a.id === this.editingId);
          if (index !== -1) {
            this.assurances[index] = res;
          }
          this.isSubmitting = false;
          this.showForm = false;
          this.isEditMode = false;
          this.editingId = null;
          this.assuranceForm.reset();
          this.successMessage = 'Insurance record updated successfully!';
          this.clearSuccessMessage();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Update failed', err);
          this.errorMessage = this.getHttpErrorMessage(err);
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create new assurance
      this.assuranceService.createAssurance(request).subscribe({
        next: (res) => {
          this.assurances = [...this.assurances, res];
          this.isSubmitting = false;
          this.showForm = false;
          this.assuranceForm.reset();
          this.successMessage = 'Insurance record created successfully!';
          this.clearSuccessMessage();
          this.cdr.detectChanges();
        },
        error: (err) => {
          console.error('Submission failed', err);
          this.errorMessage = this.getHttpErrorMessage(err);
          this.isSubmitting = false;
          this.cdr.detectChanges();
        }
      });
    }
  }

  confirmDelete(id: number): void {
    this.deleteConfirmId = id;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.deleteConfirmId = null;
  }

  deleteAssurance(): void {
    if (!this.deleteConfirmId) return;

    this.assuranceService.deleteAssurance(this.deleteConfirmId).subscribe({
      next: () => {
        this.assurances = this.assurances.filter(a => a.id !== this.deleteConfirmId);
        this.showDeleteConfirm = false;
        this.deleteConfirmId = null;
        this.successMessage = 'Insurance record deleted successfully!';
        this.clearSuccessMessage();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Delete failed', err);
        this.errorMessage = this.getHttpErrorMessage(err);
        this.showDeleteConfirm = false;
        this.deleteConfirmId = null;
        this.cdr.detectChanges();
      }
    });
  }

  getErrorMessage(fieldName: string): string {
    const control = this.assuranceForm.get(fieldName);
    if (!control || !control.errors) {
      return '';
    }

    if (control.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (control.hasError('minlength')) {
      const minLen = control.getError('minlength').requiredLength;
      return `${this.getFieldLabel(fieldName)} must be at least ${minLen} characters`;
    }
    if (control.hasError('maxlength')) {
      const maxLen = control.getError('maxlength').requiredLength;
      return `${this.getFieldLabel(fieldName)} cannot exceed ${maxLen} characters`;
    }
    if (control.hasError('pattern')) {
      return this.getPatternError(fieldName);
    }

    return 'Invalid input';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      providerName: 'Insurance Provider',
      policyNumber: 'Policy Number',
      coverageDetails: 'Coverage Details',
      illness: 'Illness/Condition',
      postalCode: 'Postal Code',
      mobilePhone: 'Mobile Phone'
    };
    return labels[fieldName] || fieldName;
  }

  private getPatternError(fieldName: string): string {
    if (fieldName === 'postalCode') {
      return 'Postal Code must be 5 digits (e.g., 12345)';
    }
    if (fieldName === 'mobilePhone') {
      return 'Mobile Phone must be a valid phone number';
    }
    return 'Invalid format';
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.assuranceForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  private getHttpErrorMessage(err: any): string {
    if (err.status === 400 && err.error?.errors) {
      // Validation errors from backend
      const errors = err.error.errors;
      return Object.values(errors).join(', ');
    }
    if (err.error?.message) {
      return err.error.message;
    }
    return 'An error occurred. Please try again.';
  }

  private clearSuccessMessage(): void {
    setTimeout(() => {
      this.successMessage = null;
    }, 3000);
  }

  /**
   * Generate a risk assessment for the selected assurance
   */
  generateRiskAssessment(assuranceId: number): void {
    this.riskAssessmentLoading = true;
    this.selectedAssuranceId = assuranceId;
    this.selectedRiskAssessment = null;
    this.errorMessage = null;

    this.coverageRiskAssessmentService.generateCoverageAssessment(assuranceId, this.currentPatientId).subscribe({
      next: (assessment) => {
        this.selectedRiskAssessment = assessment;
        this.showRiskAssessment = true;
        this.riskAssessmentLoading = false;
        this.successMessage = 'Risk assessment generated successfully!';
        this.clearSuccessMessage();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error generating risk assessment', err);
        if (err.status === 409 || err.status === 500 || err.status === 0) {
          // Fallback: try loading existing assessment if generation failed due to an existing record
          this.coverageRiskAssessmentService.getRiskAssessment(assuranceId).subscribe({
            next: (existingAssessment) => {
              this.selectedRiskAssessment = existingAssessment;
              this.showRiskAssessment = true;
              this.riskAssessmentLoading = false;
              this.successMessage = 'Loaded existing risk assessment.';
              this.clearSuccessMessage();
              this.cdr.detectChanges();
            },
            error: (innerErr) => {
              console.error('Fallback load failed after generation error', innerErr);
              this.errorMessage = 'Failed to generate or load risk assessment. Please try again.';
              this.riskAssessmentLoading = false;
              this.cdr.detectChanges();
            }
          });
        } else {
          this.errorMessage = 'Failed to generate risk assessment. Please try again.';
          this.riskAssessmentLoading = false;
          this.cdr.detectChanges();
        }
      }
    });
  }

  /**
   * Load existing risk assessment for an assurance
   */
  loadRiskAssessment(assuranceId: number): void {
    console.log('DEBUG: Loading risk assessment for assuranceId:', assuranceId);
    this.riskAssessmentLoading = true;
    this.selectedAssuranceId = assuranceId;
    this.selectedRiskAssessment = null;
    this.errorMessage = null;

    this.coverageRiskAssessmentService.generateCoverageAssessment(assuranceId, this.currentPatientId).subscribe({
      next: (assessment) => {
        console.log('DEBUG: Received assessment:', {
          assuranceId: assessment.assuranceId,
          patientId: assessment.patientId,
          complexityScore: assessment.medicalComplexityScore,
          estimatedCost: assessment.estimatedAnnualClaimCost,
          alzheimerScore: assessment.alzheimersPredictionScore
        });
        this.selectedRiskAssessment = assessment;
        this.showRiskAssessment = true;
        this.riskAssessmentLoading = false;
        this.successMessage = 'Risk assessment generated successfully!';
        this.clearSuccessMessage();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading risk assessment', err);
        this.errorMessage = 'Failed to generate risk assessment. Please try again.';
        this.riskAssessmentLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Refresh/recalculate risk assessment
   */
  refreshRiskAssessment(assuranceId: number): void {
    this.riskAssessmentLoading = true;
    this.errorMessage = null;

    this.coverageRiskAssessmentService.refreshRiskAssessment(assuranceId, this.currentPatientId).subscribe({
      next: (assessment) => {
        this.selectedRiskAssessment = assessment;
        this.successMessage = 'Risk assessment refreshed successfully!';
        this.clearSuccessMessage();
        this.riskAssessmentLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error refreshing risk assessment', err);
        this.errorMessage = 'Failed to refresh risk assessment. Please try again.';
        this.riskAssessmentLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Close risk assessment view
   */
  closeRiskAssessment(): void {
    this.showRiskAssessment = false;
    this.selectedRiskAssessment = null;
    this.selectedAssuranceId = null;
  }
}

