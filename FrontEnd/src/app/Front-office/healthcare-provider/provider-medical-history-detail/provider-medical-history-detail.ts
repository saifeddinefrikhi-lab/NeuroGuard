import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MedicalHistoryService } from '../../../core/services/medical-history.service';
import { MedicalHistoryResponse } from '../../../core/models/medical-history.model';

@Component({
  selector: 'app-provider-medical-history-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './provider-medical-history-detail.html',
  styleUrls: ['./provider-medical-history-detail.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProviderMedicalHistoryDetailComponent implements OnInit {
  history: MedicalHistoryResponse | null = null;
  loading = false;
  errorMessage = '';
  patientId: number | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private medicalHistoryService: MedicalHistoryService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('patientId');
    if (idParam) {
      this.patientId = +idParam;
      this.loadHistory(this.patientId);
    } else {
      this.errorMessage = 'No patient ID provided';
    }
  }

  loadHistory(patientId: number): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.medicalHistoryService.getByPatientId(patientId).subscribe({
      next: (data) => {
        this.history = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load medical history.';
        console.error('Error loading medical history:', err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  downloadFile(fileId: number, fileName: string): void {
    this.medicalHistoryService.downloadFile(fileId).subscribe({
      next: (blob) => {
        // Use file-saver or create a link
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (err) => {
        console.error('File download failed:', err);
        alert('Failed to download file.');
      }
    });
  }

  deleteFile(fileId: number): void {
    if (this.patientId && confirm('Are you sure you want to delete this file?')) {
      this.medicalHistoryService.deletePatientFile(this.patientId, fileId).subscribe({
        next: () => {
          if (this.history) {
            this.history.files = this.history.files.filter(f => f.id !== fileId);
            this.cdr.markForCheck();
          }
        },
        error: (err) => {
          console.error('Error deleting file:', err);
          alert('Failed to delete file.');
        }
      });
    }
  }

  goBack(): void {
    this.router.navigate(['/provider/medical-history']);
  }
}