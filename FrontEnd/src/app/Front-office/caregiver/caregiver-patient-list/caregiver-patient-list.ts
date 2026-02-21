import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MedicalHistoryService } from '../../../core/services/medical-history.service';
import { UserDto } from '../../../core/models/user.dto';

@Component({
  selector: 'app-caregiver-patient-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './caregiver-patient-list.html',
  styleUrls: ['./caregiver-patient-list.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CaregiverPatientListComponent implements OnInit {
  patients: UserDto[] = [];
  loading = false;
  errorMessage = '';

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
        this.patients = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = 'Failed to load assigned patients.';
        console.error(err);
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  viewHistory(patientId: number): void {
    this.router.navigate(['/caregiver/medical-history/view', patientId]);
  } 
}