import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PrescriptionService } from '../../../../core/services/prescription.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PrescriptionResponse } from '../../../../core/models/prescription.model';

@Component({
  selector: 'app-prescription-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './prescription-detail.component.html',
  styleUrls: ['./prescription-detail.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrescriptionDetailComponent implements OnInit {
  prescription: PrescriptionResponse | null = null;
  loading = false;
  errorMessage = '';
  prescriptionId: number | null = null;
  canEdit = false;
  canDelete = false;
  backUrl = '/provider/prescriptions';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private prescriptionService: PrescriptionService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.prescriptionId = +idParam;
      this.setBackUrl();
      const role = this.authService.currentUser?.role ?? '';
      this.canEdit = role === 'PROVIDER' || role === 'ADMIN';
      this.canDelete = role === 'PROVIDER' || role === 'ADMIN';
      this.loadPrescription(this.prescriptionId);
    } else {
      this.errorMessage = 'No prescription ID provided';
      this.cdr.markForCheck();
    }
  }

  setBackUrl(): void {
    const role = this.authService.currentUser?.role ?? '';
    if (role === 'ADMIN') this.backUrl = '/admin/prescriptions';
    else if (role === 'PATIENT') this.backUrl = '/patient/prescriptions';
    else if (role === 'CAREGIVER') this.backUrl = '/caregiver/prescriptions';
    else this.backUrl = '/provider/prescriptions';
  }

  loadPrescription(id: number): void {
    this.loading = true;
    this.cdr.markForCheck();
    this.prescriptionService.getById(id).subscribe({
      next: (data) => {
        this.prescription = data;
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.errorMessage = err?.message || 'Failed to load prescription.';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  onEdit(): void {
    if (!this.prescriptionId) return;
    const role = this.authService.currentUser?.role ?? '';
    if (role === 'ADMIN') this.router.navigate(['/admin/prescriptions/edit', this.prescriptionId]);
    else this.router.navigate(['/provider/prescriptions/edit', this.prescriptionId]);
  }

  onDelete(): void {
    if (!this.prescription || !this.canDelete) return;
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette ordonnance ?')) return;
    this.prescriptionService.delete(this.prescription.id).subscribe({
      next: () => this.router.navigate([this.backUrl]),
      error: (err) => alert('Échec de la suppression. ' + (err?.message || ''))
    });
  }

  goBack(): void {
    this.router.navigate([this.backUrl]);
  }
}
