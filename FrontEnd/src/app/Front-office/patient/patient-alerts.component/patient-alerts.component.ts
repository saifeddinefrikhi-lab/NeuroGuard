import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AlertService } from '../../../core/services/alert.service';
import { AlertResponse } from '../../../core/models/alert.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-patient-alerts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-alerts.component.html',
  styleUrls: ['./patient-alerts.component.scss']
})
export class PatientAlertsComponent implements OnInit, OnDestroy {
  alerts: AlertResponse[] = [];
  filteredAlerts: AlertResponse[] = [];
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
    this.alertService.getMyAlerts().subscribe({
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
    let filtered = [...this.alerts];

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

  // Helper to get CSS class based on severity
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