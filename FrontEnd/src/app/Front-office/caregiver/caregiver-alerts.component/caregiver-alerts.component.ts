import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../core/services/alert.service';
import { AlertResponse } from '../../../core/models/alert.model';
import { MedicalHistoryService } from '../../../core/services/medical-history.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-caregiver-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './caregiver-alerts.component.html',
  styleUrls: ['./caregiver-alerts.component.scss']
})
export class CaregiverAlertsComponent implements OnInit, OnDestroy {
  alerts: AlertResponse[] = [];
  filteredAlerts: AlertResponse[] = [];
  patients: Array<{ id: number; name: string }> = [];
  filteredPatients: Array<{ id: number; name: string }> = [];

  patientSearchQuery = '';
  selectedPatientId: number | null = null;
  showPatientDropdown = false;

  searchQuery = '';
  severityFilter = '';
  statusFilter = '';
  sortBy: 'date' | 'severity' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';
  currentPage = 1;
  pageSize = 6;
  totalPages = 1;

  loading = false;
  error: string | null = null;
  private wsSubscription?: Subscription;

  constructor(
    private alertService: AlertService,
    private medicalHistoryService: MedicalHistoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    setTimeout(() => this.loadAlerts());
    this.wsSubscription = this.alertService.getPatientAlertStream().subscribe(newAlert => {
      const index = this.alerts.findIndex(a => a.id === newAlert.id);
      if (index !== -1) {
        this.alerts[index] = newAlert;
      } else {
        this.alerts.unshift(newAlert);
      }
      this.applyFiltersAndSort();
      this.cdr.detectChanges();
    });
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  loadAlerts(): void {
    this.loading = true;
    this.error = null;
    this.cdr.detectChanges();

    this.medicalHistoryService.getAssignedPatients().subscribe({
      next: (patientsList) => {
        this.patients = patientsList.map(p => ({ id: p.id, name: p.firstName + ' ' + p.lastName }));
        this.filteredPatients = [...this.patients];
        
        // Subscribe to WS stream for each assigned patient immediately
        this.patients.forEach(patient => {
          this.alertService.subscribeToPatientAlerts(patient.id);
        });

        // After subscribing, fetch the historic alerts
        this.alertService.getCaregiverAlerts().subscribe({
          next: (data) => {
            this.alerts = data;
            this.applyFiltersAndSort();
            this.loading = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            this.error = err.message || 'Failed to load alerts';
            this.loading = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
         this.error = 'Failed to load assigned patients';
         this.loading = false;
         this.cdr.detectChanges();
      }
    });

  }

  // initializePatients is no longer needed since we fetch them from medicalHistoryService
  initializePatients(): void {}

  onPatientSearchChange(searchQuery: string): void {
    this.patientSearchQuery = searchQuery;
    const query = searchQuery.trim().toLowerCase();

    if (!query && this.selectedPatientId) {
      this.selectedPatientId = null;
      this.currentPage = 1;
      this.applyFiltersAndSort();
    }

    this.filteredPatients = query
      ? this.patients.filter(patient => patient.name.toLowerCase().includes(query))
      : [...this.patients];
  }

  selectPatient(patient: { id: number; name: string }): void {
    this.selectedPatientId = patient.id;
    this.patientSearchQuery = '';
    this.showPatientDropdown = false;
    this.filteredPatients = [];
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  getSelectedPatientName(): string {
    if (!this.selectedPatientId) {
      return '';
    }
    const patient = this.patients.find(p => p.id === this.selectedPatientId);
    return patient ? patient.name : '';
  }

  openPatientDropdown(): void {
    this.showPatientDropdown = true;
    this.onPatientSearchChange(this.patientSearchQuery);
  }

  closePatientDropdown(): void {
    this.showPatientDropdown = false;
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  onSeverityFilterChange(value: string): void {
    this.severityFilter = value;
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  onStatusFilterChange(value: string): void {
    this.statusFilter = value;
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  onSortChange(sortBy: 'date' | 'severity', sortOrder: 'asc' | 'desc'): void {
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
    this.currentPage = 1;
    this.applyFiltersAndSort();
  }

  applyFiltersAndSort(): void {
    if (!this.selectedPatientId) {
      this.filteredAlerts = [];
      this.totalPages = 1;
      this.currentPage = 1;
      return;
    }

    let filtered = [...this.alerts];

    filtered = filtered.filter(alert => alert.patientId === this.selectedPatientId);

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(alert =>
        alert.message.toLowerCase().includes(query) ||
        alert.patientName.toLowerCase().includes(query)
      );
    }

    if (this.severityFilter) {
      filtered = filtered.filter(alert => alert.severity === this.severityFilter);
    }

    if (this.statusFilter === 'resolved') {
      filtered = filtered.filter(alert => alert.resolved);
    } else if (this.statusFilter === 'pending') {
      filtered = filtered.filter(alert => !alert.resolved);
    }

    filtered.sort((firstAlert, secondAlert) => {
      let comparison = 0;
      if (this.sortBy === 'date') {
        comparison = new Date(firstAlert.createdAt).getTime() - new Date(secondAlert.createdAt).getTime();
      } else {
        const severityOrder: Record<string, number> = { INFO: 1, WARNING: 2, CRITICAL: 3 };
        comparison = (severityOrder[firstAlert.severity] || 0) - (severityOrder[secondAlert.severity] || 0);
      }
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.totalPages = Math.max(1, Math.ceil(filtered.length / this.pageSize));
    this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages));

    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.filteredAlerts = filtered.slice(startIndex, startIndex + this.pageSize);
  }

  goToPage(page: number): void {
    const targetPage = Math.max(1, Math.min(page, this.totalPages));
    if (targetPage !== this.currentPage) {
      this.currentPage = targetPage;
      this.applyFiltersAndSort();
    }
  }

  goToPreviousPage(): void {
    this.goToPage(this.currentPage - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage + 1);
  }

  onPageChange(): void {
    this.currentPage = Number(this.currentPage);
    this.applyFiltersAndSort();
  }

  get allPages(): number[] {
    const pages: number[] = [];
    for (let index = 1; index <= this.totalPages; index++) {
      pages.push(index);
    }
    return pages;
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

  resolveAlert(alertId: number): void {
    this.alertService.resolveAlert(alertId).subscribe({
      next: () => {
        const alert = this.alerts.find(a => a.id === alertId);
        if (alert) {
          alert.resolved = true;
        }
        this.applyFiltersAndSort();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error resolving alert:', err);
        this.error = 'Failed to resolve alert';
        this.cdr.detectChanges();
      }
    });
  }
}