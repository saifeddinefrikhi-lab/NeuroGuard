import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertService } from '../../../core/services/alert.service';
import { MedicalHistoryService } from '../../../core/services/medical-history.service'; // to get patients list
import { AlertResponse, AlertRequest } from '../../../core/models/alert.model';
import { UserDto } from '../../../core/models/user.dto';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-provider-alerts',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './provider-alerts.component.html',
  styleUrls: ['./provider-alerts.component.scss']
})
export class ProviderAlertsComponent implements OnInit, OnDestroy {
  alerts: AlertResponse[] = [];
  filteredAlerts: AlertResponse[] = [];
  patients: UserDto[] = [];
  selectedPatientId: number | null = null;
  loading = false;
  error: string | null = null;
  successMessage: string | null = null;

  // Form for creating/updating alert
  alertForm: FormGroup;
  editingAlertId: number | null = null;
  showForm = false;
  private wsSubscription?: Subscription;

  // Search, Filter, Sort, Pagination
  searchQuery = '';
  severityFilter = '';
  statusFilter = ''; // '' for all, 'resolved', 'pending'
  sortBy: 'date' | 'severity' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  currentPage = 1;
  pageSize = 6;
  totalPages = 1;
  Math = Math;

  // Patient Selector with Search
  patientSearchQuery = '';
  filteredPatients: UserDto[] = [];
  showPatientDropdown = false;

  constructor(
    private alertService: AlertService,
    private medicalHistoryService: MedicalHistoryService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    this.alertForm = this.fb.group({
      patientId: ['', Validators.required],
      message: ['', [Validators.required, Validators.maxLength(500)]],
      severity: ['INFO', Validators.required]
    });
  }

  ngOnInit(): void {
    // Defer initial data loading to avoid ExpressionChangedAfterItHasBeenCheckedError
    setTimeout(() => {
      this.loadPatients();
      this.loadAllAlerts();
    });
    this.wsSubscription = this.alertService.getProviderAlertStream().subscribe(newAlert => {
       if (!this.selectedPatientId || this.selectedPatientId === newAlert.patientId) {
          const index = this.alerts.findIndex(a => a.id === newAlert.id);
          if (index !== -1) {
            this.alerts[index] = newAlert;
          } else {
            this.alerts.unshift(newAlert);
          }
          this.currentPage = 1;
          this.applyFiltersAndSort();
          this.cdr.detectChanges();
       }
    });
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  loadPatients(): void {
    this.medicalHistoryService.getPatients().subscribe({
      next: (data) => {
        this.patients = data;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.error = 'Failed to load patients: ' + err.message;
        this.cdr.detectChanges();
      }
    });
  }

  loadAllAlerts(): void {
    this.loading = true;
    this.error = null;
    // Since provider endpoint to get all alerts doesn't exist, we'll load by selected patient or just load all? 
    // For simplicity, we'll initially load all alerts by iterating patients? That's inefficient.
    // Better: provider can view alerts by selecting a patient from dropdown.
    // So we'll not load all initially; instead we'll load when a patient is selected.
    if (this.selectedPatientId) {
      this.loadAlertsForPatient(this.selectedPatientId);
    } else {
      this.alerts = [];
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  onPatientSelect(patientId: number): void {
    this.selectedPatientId = patientId;
    this.loadAlertsForPatient(patientId);
  }

  onPatientSearchChange(searchQuery: string): void {
    this.patientSearchQuery = searchQuery;
    if (searchQuery.trim() === '') {
      this.filteredPatients = this.patients;
    } else {
      const query = searchQuery.toLowerCase();
      this.filteredPatients = this.patients.filter(patient =>
        `${patient.firstName} ${patient.lastName}`.toLowerCase().includes(query) ||
        patient.email?.toLowerCase().includes(query)
      );
    }
    this.cdr.detectChanges();
  }

  selectPatient(patient: UserDto): void {
    this.selectedPatientId = patient.id;
    this.patientSearchQuery = `${patient.firstName} ${patient.lastName}`;
    this.showPatientDropdown = false;
    this.filteredPatients = [];
    this.loadAlertsForPatient(patient.id);
  }

  getSelectedPatientName(): string {
    if (this.selectedPatientId) {
      const patient = this.patients.find(p => p.id === this.selectedPatientId);
      return patient ? `${patient.firstName} ${patient.lastName}` : '';
    }
    return '';
  }

  closePatientDropdown(): void {
    this.showPatientDropdown = false;
  }

  openPatientDropdown(): void {
    this.showPatientDropdown = true;
    this.onPatientSearchChange(this.patientSearchQuery);
    this.cdr.detectChanges();
  }

  loadAlertsForPatient(patientId: number): void {
    this.loading = true;
    this.cdr.detectChanges();
    console.log(`[ProviderAlertsComponent] Loading alerts for patient ${patientId}`);
    this.alertService.getAlertsByPatient(patientId).subscribe({
      next: (data) => {
        console.log(`[ProviderAlertsComponent] Retrieved ${data.length} alerts for patient ${patientId}`);
        this.alerts = data;
        this.currentPage = 1;
        this.applyFiltersAndSort();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error(`[ProviderAlertsComponent] Failed to load alerts for patient ${patientId}:`, err);
        if (err.message && err.message.includes('403')) {
          this.error = 'You do not have permission to view alerts for this patient.';
        } else {
          this.error = `Failed to load alerts: ${err.message}`;
        }
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Trigger generation
  triggerGeneration(): void {
    if (!this.selectedPatientId) {
      this.error = 'Please select a patient first before triggering alert generation.';
      this.cdr.detectChanges();
      return;
    }
    console.log('[ProviderAlertsComponent] Triggering alert generation');
    this.alertService.triggerAlertGeneration(this.selectedPatientId).subscribe({
      next: (response) => {
        this.successMessage = 'Alert generation triggered successfully.';
        console.log('[ProviderAlertsComponent] Alert generation completed');
        this.cdr.detectChanges();
        if (this.selectedPatientId) {
          this.loadAlertsForPatient(this.selectedPatientId);
        }
        setTimeout(() => {
          this.successMessage = null;
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        console.error('[ProviderAlertsComponent] Alert generation failed:', err);
        if (err.message && err.message.includes('403')) {
          this.error = 'You do not have permission to trigger alert generation.';
        } else {
          this.error = `Alert generation failed: ${err.message}`;
        }
        this.cdr.detectChanges();
      }
    });
  }

  // Show create form
  newAlert(): void {
    this.editingAlertId = null;
    this.alertForm.reset({ severity: 'INFO' });
    if (this.selectedPatientId) {
      this.alertForm.patchValue({ patientId: this.selectedPatientId });
    }
    this.showForm = true;
  }

  // Edit alert
  editAlert(alert: AlertResponse): void {
    this.editingAlertId = alert.id;
    this.alertForm.patchValue({
      patientId: alert.patientId,
      message: alert.message,
      severity: alert.severity
    });
    this.showForm = true;
  }

  // Cancel form
  cancelForm(): void {
    this.showForm = false;
    this.editingAlertId = null;
    this.alertForm.reset();
  }

  // Submit form (create or update)
  onSubmit(): void {
    if (this.alertForm.invalid) return;
    const request: AlertRequest = this.alertForm.value;
    if (this.editingAlertId) {
      // Update
      console.log(`[ProviderAlertsComponent] Updating alert ${this.editingAlertId}:`, request);
      this.alertService.updateAlert(this.editingAlertId, request).subscribe({
        next: (updated) => {
          this.successMessage = 'Alert updated.';
          console.log(`[ProviderAlertsComponent] Alert ${this.editingAlertId} updated successfully`);
          this.cancelForm();
          this.cdr.detectChanges();
          if (this.selectedPatientId) {
            this.loadAlertsForPatient(this.selectedPatientId);
          }
          setTimeout(() => {
            this.successMessage = null;
            this.cdr.detectChanges();
          }, 3000);
        },
        error: (err) => {
          console.error(`[ProviderAlertsComponent] Failed to update alert:`, err);
          if (err.message && err.message.includes('403')) {
            this.error = 'You do not have permission to update this alert.';
          } else {
            this.error = `Failed to update alert: ${err.message}`;
          }
          this.cdr.detectChanges();
        }
      });
    } else {
      // Create
      console.log(`[ProviderAlertsComponent] Creating new alert:`, request);
      this.alertService.createAlert(request).subscribe({
        next: (created) => {
          this.successMessage = 'Alert created.';
          console.log(`[ProviderAlertsComponent] Alert ${created.id} created successfully`);
          this.cancelForm();
          this.cdr.detectChanges();
          if (this.selectedPatientId === created.patientId) {
            this.alerts = [...this.alerts, created];
            this.applyFiltersAndSort();
          } else if (this.selectedPatientId) {
            this.loadAlertsForPatient(this.selectedPatientId);
          }
          setTimeout(() => {
            this.successMessage = null;
            this.cdr.detectChanges();
          }, 3000);
        },
        error: (err) => {
          console.error(`[ProviderAlertsComponent] Failed to create alert:`, err);
          if (err.message && err.message.includes('403')) {
            this.error = 'You do not have permission to create alerts.';
          } else {
            this.error = `Failed to create alert: ${err.message}`;
          }
          this.cdr.detectChanges();
        }
      });
    }
  }

  // Delete alert
  deleteAlert(alertId: number): void {
    if (!confirm('Are you sure you want to delete this alert?')) return;
    console.log(`[ProviderAlertsComponent] Attempting to delete alert ${alertId}`);
    this.alertService.deleteAlert(alertId).subscribe({
      next: () => {
        this.successMessage = 'Alert deleted.';
        this.alerts = this.alerts.filter(a => a.id !== alertId);
        this.applyFiltersAndSort();
        this.cdr.detectChanges();
        console.log(`[ProviderAlertsComponent] Alert ${alertId} deleted successfully`);
        setTimeout(() => {
          this.successMessage = null;
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        console.error(`[ProviderAlertsComponent] Failed to delete alert ${alertId}:`, err);
        // Provide user-friendly error messages
        if (err.message && err.message.includes('403')) {
          this.error = 'You do not have permission to delete this alert. Please contact your system administrator.';
        } else if (err.message && err.message.includes('404')) {
          this.error = 'Alert not found. It may have already been deleted.';
        } else {
          this.error = `Failed to delete alert: ${err.message}`;
        }
        this.cdr.detectChanges();
        setTimeout(() => {
          this.error = null;
          this.cdr.detectChanges();
        }, 5000);
      }
    });
  }

  getSeverityClass(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'bg-danger text-white';
      case 'WARNING': return 'bg-warning text-dark';
      case 'INFO': return 'bg-info text-white';
      default: return 'bg-secondary text-white';
    }
  }

  getSeverityIcon(severity: string): string {
    switch (severity?.toUpperCase()) {
      case 'CRITICAL': return 'ti-alert-triangle';
      case 'WARNING': return 'ti-alert-circle';
      case 'INFO': return 'ti-info-circle';
      default: return 'ti-bell';
    }
  }

  // Trigger predictive generation
  triggerPredictiveGeneration(): void {
    if (!this.selectedPatientId) {
      this.error = 'Please select a patient first before triggering ML predictive generation.';
      this.cdr.detectChanges();
      return;
    }
    console.log('[ProviderAlertsComponent] Triggering ML predictive alert generation');
    this.alertService.triggerPredictiveGeneration(this.selectedPatientId).subscribe({
      next: (response) => {
        this.successMessage = 'ML predictive alert generation triggered.';
        console.log('[ProviderAlertsComponent] Predictive generation completed');
        this.cdr.detectChanges();
        if (this.selectedPatientId) {
          this.loadAlertsForPatient(this.selectedPatientId);
        }
        setTimeout(() => {
          this.successMessage = null;
          this.cdr.detectChanges();
        }, 3000);
      },
      error: (err) => {
        console.error('[ProviderAlertsComponent] Predictive generation failed:', err);
        if (err.message && err.message.includes('403')) {
          this.error = 'You do not have permission to trigger ML predictive generation.';
        } else {
          this.error = `Predictive generation failed: ${err.message}`;
        }
        this.cdr.detectChanges();
      }
    });
  }

// Search, Filter, Sort, and Pagination Methods
onSearchChange(query: string): void {
  this.searchQuery = query.toLowerCase();
  this.currentPage = 1;
  this.applyFiltersAndSort();
}

onSeverityFilterChange(severity: string): void {
  this.severityFilter = severity;
  this.currentPage = 1;
  this.applyFiltersAndSort();
}

onStatusFilterChange(status: string): void {
  this.statusFilter = status;
  this.currentPage = 1;
  this.applyFiltersAndSort();
}

onSortChange(field: 'date' | 'severity', order: 'asc' | 'desc'): void {
  this.sortBy = field;
  this.sortOrder = order;
  this.applyFiltersAndSort();
}

applyFiltersAndSort(): void {
  let result = [...this.alerts];

  // Apply search filter
  if (this.searchQuery) {
    result = result.filter(alert =>
      alert.message.toLowerCase().includes(this.searchQuery) ||
      alert.patientName.toLowerCase().includes(this.searchQuery)
    );
  }

  // Apply severity filter
  if (this.severityFilter) {
    result = result.filter(alert =>
      alert.severity.toUpperCase() === this.severityFilter.toUpperCase()
    );
  }

  // Apply status filter
  if (this.statusFilter === 'resolved') {
    result = result.filter(alert => alert.resolved);
  } else if (this.statusFilter === 'pending') {
    result = result.filter(alert => !alert.resolved);
  }

  // Apply sorting
  result.sort((a, b) => {
    let comparison = 0;
    if (this.sortBy === 'date') {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      comparison = dateA - dateB;
    } else if (this.sortBy === 'severity') {
      const severityOrder = { CRITICAL: 3, WARNING: 2, INFO: 1 };
      const severityA = severityOrder[a.severity as keyof typeof severityOrder] || 0;
      const severityB = severityOrder[b.severity as keyof typeof severityOrder] || 0;
      comparison = severityA - severityB;
    }
    return this.sortOrder === 'asc' ? comparison : -comparison;
  });

  // Update total pages
  this.totalPages = Math.ceil(result.length / this.pageSize);
  this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages));

  // Apply pagination
  const startIndex = (this.currentPage - 1) * this.pageSize;
  this.filteredAlerts = result.slice(startIndex, startIndex + this.pageSize);

  this.cdr.detectChanges();
}

goToPage(page: number): void {
  const targetPage = Math.max(1, Math.min(page, this.totalPages));
  if (targetPage !== this.currentPage) {
    this.currentPage = targetPage;
    this.applyFiltersAndSort();
  }
}

goToFirstPage(): void {
  this.goToPage(1);
}

goToLastPage(): void {
  this.goToPage(this.totalPages);
}

goToPreviousPage(): void {
  this.goToPage(this.currentPage - 1);
}

goToNextPage(): void {
  this.goToPage(this.currentPage + 1);
}

onPageChange(): void {
  // Ensure currentPage is a number (select returns string)
  this.currentPage = Number(this.currentPage);
  this.applyFiltersAndSort();
}

get allPages(): number[] {
  const pages: number[] = [];
  for (let i = 1; i <= this.totalPages; i++) {
    pages.push(i);
  }
  return pages;
}
}