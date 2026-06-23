import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MedicalHistoryService } from '../../../core/services/medical-history.service';
import { UserDto } from '../../../core/models/user.dto';

@Component({
  selector: 'app-caregiver-patient-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './caregiver-patient-list.html',
  styleUrls: ['./caregiver-patient-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CaregiverPatientListComponent implements OnInit {
  patients: UserDto[] = [];
  filteredPatients: UserDto[] = [];
  paginatedPatients: UserDto[] = [];
  loading = false;
  errorMessage = '';

  // Search, Filter, Sort, Pagination
  searchQuery = '';
  roleFilter = '';
  sortBy: 'name' | 'email' = 'name';
  sortOrder: 'asc' | 'desc' = 'asc';
  currentPage = 1;
  pageSize = 2;
  totalPages = 1;
  Math = Math;

  constructor(
    private medicalHistoryService: MedicalHistoryService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadPatients();
  }

  loadPatients(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.medicalHistoryService.getAssignedPatients().subscribe({
      next: (data) => {
        console.log('[CaregiverPatientList] Received patients data:', data);
        this.patients = data;
        this.applyFiltersAndSort();
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load assigned patients.';
        console.error('[CaregiverPatientList] Error loading patients:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  applyFiltersAndSort(): void {
    let filtered = [...this.patients];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        `${p.firstName} ${p.lastName}`.toLowerCase().includes(query) ||
        p.email?.toLowerCase().includes(query) ||
        p.username?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'name':
          const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
          const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
          comparison = nameA.localeCompare(nameB);
          break;
        case 'email':
          const emailA = (a.email || '').toLowerCase();
          const emailB = (b.email || '').toLowerCase();
          comparison = emailA.localeCompare(emailB);
          break;
      }
      
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredPatients = filtered;

    // Update total pages
    this.totalPages = Math.ceil(filtered.length / this.pageSize);
    this.currentPage = Math.max(1, Math.min(this.currentPage, this.totalPages));

    // Apply pagination
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedPatients = filtered.slice(startIndex, startIndex + this.pageSize);

    this.cdr.markForCheck();
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFiltersAndSort();
    this.cdr.markForCheck();
  }

  onSortChange(sortBy: 'name' | 'email', sortOrder: 'asc' | 'desc'): void {
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
    this.applyFiltersAndSort();
    this.cdr.markForCheck();
  }

  viewHistory(patientId: number): void {
    this.router.navigate(['/caregiver/medical-history/view', patientId]);
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