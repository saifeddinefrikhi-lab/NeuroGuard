import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MedicalHistoryService } from '../../../core/services/medical-history.service';
import { MedicalHistoryResponse } from '../../../core/models/medical-history.model';

@Component({
  selector: 'app-provider-medical-history-list',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './provider-medical-history-list.html',
  styleUrls: ['./provider-medical-history-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProviderMedicalHistoryListComponent implements OnInit {
  histories: MedicalHistoryResponse[] = [];
  filteredHistories: MedicalHistoryResponse[] = [];
  paginatedHistories: MedicalHistoryResponse[] = [];
  loading = false;
  errorMessage = '';

  // Search, Filter, Sort
  searchQuery = '';
  stageFilter = '';
  sortBy: 'date' | 'patient' | 'stage' = 'date';
  sortOrder: 'asc' | 'desc' = 'desc';

  // Pagination
  currentPage = 1;
  pageSize = 2;

  get totalPages(): number {
    return Math.ceil(this.filteredHistories.length / this.pageSize);
  }

  constructor(
    private medicalHistoryService: MedicalHistoryService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadHistories();
  }

  loadHistories(): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.medicalHistoryService.getAllForProvider().subscribe({
      next: (data) => {
        this.histories = data;
        this.applyFiltersAndSort();
        this.loading = false;
        this.errorMessage = '';
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load medical histories.';
        console.error('Error loading medical histories:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  applyFiltersAndSort(): void {
    // Ensure this.histories is an array
    if (!Array.isArray(this.histories)) {
      const histData = this.histories as any;
      if (histData?.content && Array.isArray(histData.content)) {
        this.histories = histData.content;
      } else {
        this.histories = [];
      }
    }
    let filtered = [...this.histories];

    // Apply search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(h => 
        h.patientName?.toLowerCase().includes(query) ||
        h.diagnosis?.toLowerCase().includes(query) ||
        h.patientId?.toString().includes(query)
      );
    }

    // Apply stage filter
    if (this.stageFilter) {
      filtered = filtered.filter(h => 
        h.progressionStage?.toLowerCase() === this.stageFilter.toLowerCase()
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'date':
          const dateA = new Date(a.updatedAt || 0).getTime();
          const dateB = new Date(b.updatedAt || 0).getTime();
          comparison = dateA - dateB;
          break;
        case 'patient':
          comparison = (a.patientName || '').localeCompare(b.patientName || '');
          break;
        case 'stage':
          const stageOrder = { 'mild': 1, 'moderate': 2, 'severe': 3, 'unknown': 4 };
          const stageA = stageOrder[a.progressionStage?.toLowerCase() as keyof typeof stageOrder] || 4;
          const stageB = stageOrder[b.progressionStage?.toLowerCase() as keyof typeof stageOrder] || 4;
          comparison = stageA - stageB;
          break;
      }
      
      return this.sortOrder === 'asc' ? comparison : -comparison;
    });

    this.filteredHistories = filtered;

    // Reset to first page and apply pagination
    this.currentPage = 1;
    this.applyPagination();
  }

  applyPagination(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.paginatedHistories = this.filteredHistories.slice(start, end);
    this.cdr.markForCheck();
  }

  goToPage(page: number): void {
    const targetPage = Math.max(1, Math.min(page, this.totalPages));
    if (targetPage !== this.currentPage) {
      this.currentPage = targetPage;
      this.applyPagination();
    }
  }

  goToPreviousPage(): void {
    if (this.currentPage > 1) {
      this.goToPage(this.currentPage - 1);
    }
  }

  goToNextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.goToPage(this.currentPage + 1);
    }
  }

  onPageChange(): void {
    this.applyPagination();
  }

  get allPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  onSearchChange(query: string): void {
    this.searchQuery = query;
    this.applyFiltersAndSort();
    this.cdr.markForCheck();
  }

  onStageFilterChange(stage: string): void {
    this.stageFilter = stage;
    this.applyFiltersAndSort();
    this.cdr.markForCheck();
  }

  onSortChange(sortBy: 'date' | 'patient' | 'stage', sortOrder: 'asc' | 'desc'): void {
    this.sortBy = sortBy;
    this.sortOrder = sortOrder;
    this.applyFiltersAndSort();
    this.cdr.markForCheck();
  }

  onAdd(): void {
    console.log('[ProviderMedicalHistoryList] onAdd() called, attempting navigation to /provider/medical-history/new');
    this.router.navigate(['/provider/medical-history/new']).then(success => {
      console.log('[ProviderMedicalHistoryList] Navigation result:', success);
    }).catch(err => {
      console.error('[ProviderMedicalHistoryList] Navigation error:', err);
    });
  }

  onView(patientId: number): void {
    this.router.navigate(['/provider/medical-history/view', patientId]);
  }

  onUpdate(patientId: number): void {
    this.router.navigate(['/provider/medical-history/edit', patientId]);
  }

  onDelete(patientId: number): void {
    if (confirm('Are you sure you want to delete this medical history?')) {
      this.medicalHistoryService.delete(patientId).subscribe({
        next: () => {
          this.histories = this.histories.filter(h => h.patientId !== patientId);
          this.applyFiltersAndSort();
          this.cdr.markForCheck();
        },
        error: (err) => {
          alert('Failed to delete. ' + err.message);
          console.error('Error deleting medical history:', err);
        }
      });
    }
  }
}