import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { PrescriptionService } from '../../../../core/services/prescription.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PrescriptionRequest } from '../../../../core/models/prescription.model';
import { UserDto } from '../../../../core/models/user.dto';

const CONTENU_MAX_LENGTH = 5000;
const CONTENU_MIN_LENGTH = 10;

@Component({
  selector: 'app-prescription-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './prescription-form.component.html',
  styleUrls: ['./prescription-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class PrescriptionFormComponent implements OnInit {
  form: FormGroup;
  isEditMode = false;
  prescriptionId: number | null = null;
  loading = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';
  patients: UserDto[] = [];
  providers: UserDto[] = [];
  isAdmin = false;
  backUrl = '/provider/prescriptions';
  readonly contenuMaxLength = CONTENU_MAX_LENGTH;
  readonly contenuMinLength = CONTENU_MIN_LENGTH;

  medicationTemplates = [
    {
      label: 'Antibiotique court terme',
      text: 'Amoxicilline 500mg - 3 fois par jour pendant 7 jours'
    },
    {
      label: 'Antalgique au besoin',
      text: 'Paracétamol 500mg - 1 comprimé toutes les 6 heures selon besoin, max 6/jour'
    },
    {
      label: 'Supplément vitaminique',
      text: 'Vitamine D 1000 UI - 1 fois par jour pendant 1 mois'
    },
    {
      label: 'Repos et hydratation',
      text: 'Repos au lit si nécessaire, boire 2L d\'eau par jour'
    }
  ];

  treatmentPeriodOptions = [
    '7 jours',
    '10 jours',
    '2 semaines',
    '1 mois',
    'Jusqu\'à amélioration'
  ];

  dosageOptions = [
    '1 fois par jour',
    '2 fois par jour',
    '3 fois par jour',
    'Selon besoin',
    'Avant les repas',
    'Après les repas'
  ];

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private prescriptionService: PrescriptionService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      patientId: [null as number | null, [Validators.required]],
      providerId: [null as number | null],
      contenu: ['', [Validators.required, Validators.minLength(CONTENU_MIN_LENGTH), Validators.maxLength(CONTENU_MAX_LENGTH)]],
      notes: [''],
      jour: [''],
      dosage: ['']
    });
  }

  /**
   * Get character count for a form control
   */
  charCount(controlName: string): number {
    const v = this.form.get(controlName)?.value;
    return (v ?? '').toString().length;
  }

  /**
   * Get selected patient name for preview
   */
  getSelectedPatientName(): string | null {
    const patientId = this.form.get('patientId')?.value;
    if (!patientId) return null;
    
    const patient = this.patients.find(p => p.id === patientId);
    return patient ? `${patient.firstName} ${patient.lastName}` : null;
  }

  /**
   * Get selected patient email for preview
   */
  getSelectedPatientEmail(): string | null {
    const patientId = this.form.get('patientId')?.value;
    if (!patientId) return null;
    
    const patient = this.patients.find(p => p.id === patientId);
    return patient ? patient.email : null;
  }

  onTemplateSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (!value) {
      return;
    }
    this.form.patchValue({ contenu: value });
    this.cdr.markForCheck();
  }

  onFrequencySelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (!value) {
      return;
    }
    this.form.patchValue({ jour: value });
    this.cdr.markForCheck();
  }

  onDurationSelect(event: Event): void {
    const value = (event.target as HTMLSelectElement).value;
    if (!value) {
      return;
    }
    this.form.patchValue({ dosage: value });
    this.cdr.markForCheck();
  }

  ngOnInit(): void {
    this.isAdmin = this.authService.currentUser?.role === 'ADMIN';
    if (this.isAdmin) this.backUrl = '/admin/prescriptions';

    // Load patients
    this.prescriptionService.getPatients().subscribe({
      next: (list) => {
        this.patients = list;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading patients:', err);
        this.errorMessage = 'Erreur lors du chargement des patients';
        this.cdr.markForCheck();
      }
    });

    // Load providers if admin
    if (this.isAdmin) {
      this.prescriptionService.getProviders().subscribe({
        next: (list) => {
          this.providers = list;
          this.cdr.markForCheck();
        },
        error: (err) => {
          console.error('Error loading providers:', err);
          this.cdr.markForCheck();
        }
      });
    }

    // Check for edit mode
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.isEditMode = true;
      this.prescriptionId = +idParam;
      this.loadPrescription(this.prescriptionId);
    } else {
      if (!this.isAdmin) {
        this.form.removeControl('providerId');
      }
      this.loading = false;
      this.cdr.markForCheck();
    }
  }

  /**
   * Load prescription data for editing
   */
  loadPrescription(id: number): void {
    this.loading = true;
    this.cdr.markForCheck();
    
    this.prescriptionService.getById(id).subscribe({
      next: (prescription) => {
        this.form.patchValue({
          patientId: prescription.patientId,
          providerId: this.isAdmin ? prescription.providerId : null,
          contenu: prescription.contenu ?? '',
          notes: prescription.notes ?? '',
          jour: prescription.jour ?? '',
          dosage: prescription.dosage ?? ''
        });
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        console.error('Error loading prescription:', err);
        this.errorMessage = err?.error?.message || 'Erreur lors du chargement de l\'ordonnance';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  /**
   * Handle form submission
   */
  onSubmit(): void {
    // Mark all fields as touched to display validation errors
    this.form.markAllAsTouched();
    this.cdr.markForCheck();

    if (this.form.invalid || this.submitting) {
      return;
    }

    const v = this.form.value;
    const request: PrescriptionRequest = {
      patientId: Number(v.patientId),
      contenu: (v.contenu ?? '').trim(),
      notes: (v.notes ?? '').trim() || undefined,
      jour: (v.jour ?? '').trim() || undefined,
      dosage: (v.dosage ?? '').trim() || undefined
    };

    // Add provider ID if admin and provided
    if (this.isAdmin && v.providerId) {
      request.providerId = Number(v.providerId);
    }

    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.cdr.markForCheck();

    if (this.isEditMode && this.prescriptionId) {
      // Update existing prescription
      this.prescriptionService.update(this.prescriptionId, request).subscribe({
        next: () => {
          this.successMessage = 'Ordonnance mise à jour avec succès';
          setTimeout(() => {
            this.router.navigate([this.backUrl]);
          }, 1000);
        },
        error: (err) => {
          console.error('Error updating prescription:', err);
          this.errorMessage = err?.error?.message || 'Erreur lors de la mise à jour de l\'ordonnance';
          this.submitting = false;
          this.cdr.markForCheck();
        }
      });
    } else {
      // Create new prescription
      this.prescriptionService.create(request).subscribe({
        next: () => {
          this.successMessage = 'Ordonnance créée avec succès';
          setTimeout(() => {
            this.router.navigate([this.backUrl]);
          }, 1000);
        },
        error: (err) => {
          console.error('Error creating prescription:', err);
          this.errorMessage = err?.error?.message || 'Erreur lors de la création de l\'ordonnance';
          this.submitting = false;
          this.cdr.markForCheck();
        }
      });
    }
  }

  /**
   * Navigate back to prescription list
   */
  goBack(): void {
    this.router.navigate([this.backUrl]);
  }
}
