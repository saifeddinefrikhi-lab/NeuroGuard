import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MedicalHistoryService } from '../../../core/services/medical-history.service';
import { MedicalHistoryResponse } from '../../../core/models/medical-history.model';

@Component({
  selector: 'app-provider-medical-history-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './provider-medical-history-list.html',
  styleUrls: ['./provider-medical-history-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProviderMedicalHistoryListComponent implements OnInit {
  histories: MedicalHistoryResponse[] = [];
  loading = false;
  errorMessage = '';

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

  onAdd(): void {
    this.router.navigate(['/provider/medical-history/new']);
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