import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MedicalHistoryService } from '../../../core/services/medical-history.service';
import { MedicalHistoryResponse } from '../../../core/models/medical-history.model';

@Component({
  selector: 'app-caregiver-patient-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './caregiver-patient-detail.html',
  styleUrls: ['./caregiver-patient-detail.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CaregiverPatientDetailComponent implements OnInit {
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
    this.medicalHistoryService.getPatientHistoryForCaregiver(patientId).subscribe({
      next: (data) => {
        this.history = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load medical history.';
        console.error(err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/caregiver/medical-history/patients']);
  }

  downloadFile(fileId: number, fileName: string): void {
  this.medicalHistoryService.downloadFile(fileId).subscribe({
    next: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    },
    error: (err) => {
      alert('Download failed.');
      console.error(err);
    }
  });
}
}