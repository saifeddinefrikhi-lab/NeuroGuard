import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AssuranceService, AssuranceResponse } from '../../../core/services/assurance.service';
import { SharedModule } from 'src/app/theme/shared/shared.module';

@Component({
  selector: 'app-assurance-admin',
  standalone: true,
  imports: [CommonModule, SharedModule],
  templateUrl: './assurance-admin.component.html',
  styleUrls: ['./assurance-admin.component.scss']
})
export class AssuranceAdminComponent implements OnInit {
  assurances: AssuranceResponse[] = [];
  filteredAssurances: AssuranceResponse[] = [];
  loading = false;
  showDeleteConfirm = false;
  deleteConfirmId: number | null = null;
  errorMessage: string | null = null;
  successMessage: string | null = null;

  // Search and filter properties
  searchTerm: string = '';
  statusFilter: string = 'all'; // all, PENDING, APPROVED, REJECTED
  sortBy: string = 'createdAt'; // createdAt, providerName, postalCode, mobilePhone
  sortOrder: 'asc' | 'desc' = 'desc';

  constructor(
    private assuranceService: AssuranceService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllAssurances();
  }

  loadAllAssurances(): void {
    this.loading = true;
    this.assuranceService.getAllAssurances().subscribe({
      next: (data) => {
        this.assurances = data;
        this.applyFiltersAndSort();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading assurances', err);
        this.loading = false;
        this.errorMessage = 'Unable to load insurance records. The service may be temporarily unavailable.';
        this.cdr.detectChanges();
      }
    });
  }

  applyFiltersAndSort(): void {
    let filtered = [...this.assurances];

    // Apply search filter
    if (this.searchTerm.trim()) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(item =>
        item.providerName.toLowerCase().includes(term) ||
        item.policyNumber.toLowerCase().includes(term) ||
        item.illness.toLowerCase().includes(term) ||
        item.postalCode.includes(term) ||
        item.mobilePhone.includes(term) ||
        item.patientDetails?.firstName?.toLowerCase().includes(term) ||
        item.patientDetails?.lastName?.toLowerCase().includes(term) ||
        item.patientDetails?.email?.toLowerCase().includes(term)
      );
    }

    // Apply status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(item => item.status === this.statusFilter);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (this.sortBy) {
        case 'providerName':
          aValue = a.providerName.toLowerCase();
          bValue = b.providerName.toLowerCase();
          break;
        case 'policyNumber':
          aValue = a.policyNumber.toLowerCase();
          bValue = b.policyNumber.toLowerCase();
          break;
        case 'illness':
          aValue = a.illness.toLowerCase();
          bValue = b.illness.toLowerCase();
          break;
        case 'postalCode':
          aValue = a.postalCode;
          bValue = b.postalCode;
          break;
        case 'mobilePhone':
          aValue = a.mobilePhone;
          bValue = b.mobilePhone;
          break;
        case 'status':
          aValue = a.status;
          bValue = b.status;
          break;
        case 'createdAt':
        default:
          aValue = new Date(a.createdAt).getTime();
          bValue = new Date(b.createdAt).getTime();
      }

      if (aValue < bValue) {
        return this.sortOrder === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return this.sortOrder === 'asc' ? 1 : -1;
      }
      return 0;
    });

    this.filteredAssurances = filtered;
  }

  onSearchInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.onSearch(value);
  }

  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.applyFiltersAndSort();
  }

  onStatusChange(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    this.onStatusFilterChange(value);
  }

  onStatusFilterChange(status: string): void {
    this.statusFilter = status;
    this.applyFiltersAndSort();
  }

  setSortBy(field: string): void {
    if (this.sortBy === field) {
      // Toggle sort order if same column clicked
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      // Sort ascending by default when changing column
      this.sortBy = field;
      this.sortOrder = 'asc';
    }
    this.applyFiltersAndSort();
  }

  clearFilters(): void {
    this.searchTerm = '';
    this.statusFilter = 'all';
    this.sortBy = 'createdAt';
    this.sortOrder = 'desc';
    this.applyFiltersAndSort();
  }

  /**
   * Download individual assurance PDF report
   */
  downloadPDF(id: number): void {
    try {
      this.assuranceService.downloadAssurancePDF(id).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `assurance_${id}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          this.successMessage = 'PDF downloaded successfully!';
          this.clearSuccessMessage();
        },
        error: (err) => {
          console.error('Error downloading PDF:', err);
          this.errorMessage = 'Failed to download PDF. Please try again.';
        }
      });
    } catch (e) {
      this.errorMessage = 'Error downloading PDF';
    }
  }

  /**
   * Download all filtered assurances as bulk PDF
   */
  downloadAllPDF(): void {
    if (this.filteredAssurances.length === 0) {
      this.errorMessage = 'No assurances to export';
      return;
    }

    try {
      const ids = this.filteredAssurances.map(a => a.id);
      this.assuranceService.bulkExportAssurancePDF(ids).subscribe({
        next: (blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `assurances_export_${new Date().toISOString().split('T')[0]}.pdf`;
          document.body.appendChild(a);
          a.click();
          window.URL.revokeObjectURL(url);
          document.body.removeChild(a);
          this.successMessage = `${this.filteredAssurances.length} records exported successfully!`;
          this.clearSuccessMessage();
        },
        error: (err) => {
          console.error('Error exporting PDF:', err);
          this.errorMessage = 'Failed to export PDF. Please try again.';
        }
      });
    } catch (e) {
      this.errorMessage = 'Error exporting PDF';
    }
  }

  updateStatus(id: number, status: string): void {
    this.assuranceService.updateAssuranceStatus(id, status).subscribe({
      next: (updated) => {
        const index = this.assurances.findIndex(a => a.id === id);
        if (index !== -1) {
          this.assurances[index] = updated;
        }
        this.applyFiltersAndSort();
        this.successMessage = `Status updated to ${status}`;
        this.clearSuccessMessage();
      },
      error: (err) => {
        console.error('Error updating status', err);
        this.errorMessage = this.getErrorMessage(err);
      }
    });
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
      },
      error: (err) => {
        console.error('Error deleting assurance', err);
        this.errorMessage = this.getErrorMessage(err);
        this.showDeleteConfirm = false;
        this.deleteConfirmId = null;
      }
    });
  }

  private getErrorMessage(err: any): string {
    if (err.status === 400 && err.error?.errors) {
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
}
