// src/app/provider/provider-consultations/provider-consultations.component.ts

import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { UserDto } from '../../../core/models/user.dto';
import { ConsultationService } from '../../../core/services/consultation.service';
import { AuthService } from '../../../core/services/auth.service';
import { Consultation, ConsultationType } from '../../../core/models/consultation.model';
import { Router, RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-provider-consultations',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterModule,
  ],
  templateUrl: './provider-consultations.component.html',
  styleUrls: ['./provider-consultations.component.scss']
})
export class ProviderConsultationsComponent implements OnInit {
  consultations: Consultation[] = [];
  showForm = false;
  editingConsultation: Consultation | null = null;
  consultationForm: FormGroup;
  ConsultationType = ConsultationType; // for template

  // patient/caregiver lookup
  patients: UserDto[] = [];
  caregivers: UserDto[] = [];
  patientsLoading = false;
  caregiversLoading = false;
  patientLoadError = '';
  caregiverLoadError = '';
  private apiUrl = `${environment.apiUrl}/api/assurances`; // Using Gateway
  private userUrl = `${environment.apiUrl}/users`; // To fetch patient/provider names if needed

  constructor(
    private consultationService: ConsultationService,
    private authService: AuthService,
    private fb: FormBuilder,
    private router: Router,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {
    this.consultationForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      description: ['', [Validators.maxLength(1000)]],
      startTime: ['', [Validators.required]],
      endTime: [''],
      type: [ConsultationType.PRESENTIAL, Validators.required],
      patientId: ['', Validators.required],
      caregiverId: ['']
    }, { validators: [this.startEndValidator.bind(this)] });
  }

  // Form state
  submitted = false;
  submitError = ''; // message d'erreur API affiché à l'utilisateur
  // UI search
  searchTerm = '';
  showMeetingModal = false;
  meetingUrl: SafeResourceUrl | null = null;
  meetingLink = '';
  meetingTitle = '';

  onSearch(event: Event): void {
    const v = (event.target as HTMLInputElement).value || '';
    this.searchTerm = v.trim().toLowerCase();
  }

  filteredConsultations(): Consultation[] {
    if (!this.searchTerm) return this.consultations;
    const term = this.searchTerm;
    return this.consultations.filter(c => {
      if (!c) return false;
      const id = c.id?.toString() || '';
      const title = (c.title || '').toLowerCase();
      return id.includes(term) || title.includes(term);
    });
  }

  ngOnInit(): void {
    this.loadPatients();
    this.loadCaregivers();
    this.loadConsultations();
  }

  loadConsultations(): void {
    this.consultationService.getMyConsultationsAsProvider().subscribe({
      next: (data) => {
        this.consultations = data ?? [];
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading consultations', err);
        this.cdr.detectChanges();
      }
    });
  }

  loadPatients(): void {
    this.patientsLoading = true;
    this.cdr.detectChanges();
    this.consultationService.getPatients().subscribe({
      next: (data) => {
        setTimeout(() => {
          this.patients = data ?? [];
          this.patientsLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.patientsLoading = false;
          this.patientLoadError = err?.message || 'Unable to load patient list.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  loadCaregivers(): void {
    this.caregiversLoading = true;
    this.cdr.detectChanges();
    this.consultationService.getCaregivers().subscribe({
      next: (data) => {
        setTimeout(() => {
          this.caregivers = data ?? [];
          this.caregiversLoading = false;
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        setTimeout(() => {
          this.caregiversLoading = false;
          this.caregiverLoadError = err?.message || 'Unable to load caregiver list.';
          this.cdr.detectChanges();
        });
      }
    });
  }

  getPatientName(consultation: Consultation): string {
    if (consultation.patientName) return consultation.patientName;
    const p = this.patients.find(x => x.id === consultation.patientId);
    return p ? `${p.firstName} ${p.lastName}` : (consultation.patientId?.toString() || '-');
  }

  getCaregiverName(id: number): string {
    const c = this.caregivers.find(x => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : id.toString();
  }

  onPatientSelectEvent(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    const id = Number(val);
    if (!id) {
      return;
    }
    const p = this.patients.find(x => x.id === id);
    const name = p ? `${p.firstName} ${p.lastName}` : '';
    // removed: selection handled by formControlName
  }

  onCaregiverSelectEvent(event: Event): void {
    const val = (event.target as HTMLSelectElement).value;
    const id = Number(val);
    if (!id) {
      return;
    }
    const c = this.caregivers.find(x => x.id === id);
    const name = c ? `${c.firstName} ${c.lastName}` : '';
    // removed: selection handled by formControlName
  }

  openCreateForm(): void {
    this.editingConsultation = null;
    this.submitError = '';
    this.consultationForm.reset({ type: ConsultationType.PRESENTIAL });
    this.showForm = true;
  }

  openEditForm(consultation: Consultation): void {
    this.editingConsultation = consultation;
    this.consultationForm.patchValue({
      title: consultation.title,
      description: consultation.description,
      startTime: consultation.startTime.slice(0, 16), // format for datetime-local
      endTime: consultation.endTime?.slice(0, 16),
      type: consultation.type,
      patientId: consultation.patientId,
      caregiverId: consultation.caregiverId
    });
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
    this.editingConsultation = null;
  }

  onSubmit(): void {
    this.submitted = true;
    this.submitError = '';
    this.consultationForm.markAllAsTouched();
    if (this.consultationForm.invalid) return;

    const raw = this.consultationForm.value;
    // Send IDs and names to backend (backend will ignore extra fields if not supported)
    const request: any = {
      title: raw.title,
      description: raw.description,
      startTime: raw.startTime,
      endTime: raw.endTime,
      type: raw.type,
      patientId: Number(raw.patientId),
      caregiverId: raw.caregiverId ? Number(raw.caregiverId) : undefined
    } as Partial<import('../../../core/models/consultation.model').ConsultationRequest>;
    if (this.editingConsultation) {
      this.consultationService.updateConsultation(this.editingConsultation.id, request).subscribe({
        next: () => {
          this.loadConsultations();
          this.cancelForm();
          this.router.navigate(['/provider/consultations']);
        },
        error: (err) => {
          this.submitError = err?.error?.message || err?.message || 'Error while updating.';
        }
      });
    } else {
      this.consultationService.createConsultation(request).subscribe({
        next: () => {
          this.loadConsultations();
          this.cancelForm();
          this.router.navigate(['/provider/consultations']);
        },
        error: (err) => {
          this.submitError = err?.error?.message || err?.message || 'Error while creating. Verify that Gateway and consultation service are running.';
        }
      });
    }
  }

  // Debug helper to inspect form when clicking a test button
  trySubmit(): void {
    this.submitted = true;
    this.consultationForm.markAllAsTouched();
    console.log('[ProviderConsultations] Debug trySubmit: valid=', this.consultationForm.valid, 'value=', this.consultationForm.value, 'errors=', this.consultationForm.errors);
    // call onSubmit only to simulate full submit if valid
    if (this.consultationForm.valid) {
      this.onSubmit();
    }
  }

  deleteConsultation(id: number): void {
    if (confirm('Are you sure you want to delete this consultation?')) {
      const previous = [...this.consultations];
      this.consultations = this.consultations.filter(c => c.id !== id);
      this.cdr.detectChanges();
      this.consultationService.deleteConsultation(id).subscribe({
        next: () => { /* déjà mis à jour */ },
        error: (err) => {
          this.consultations = previous;
          console.error('Delete failed', err);
          this.cdr.detectChanges();
        }
      });
    }
  }

  joinOnlineConsultation(consultation: Consultation): void {
    this.consultationService.getJoinLink(consultation.id).subscribe({
      next: (link) => {
        // Use setTimeout to avoid NG0100 error when opening modal from list
        setTimeout(() => {
          this.meetingTitle = consultation.title;
          this.meetingLink = link;
          this.meetingUrl = this.sanitizer.bypassSecurityTrustResourceUrl(link + '#config.prejoinPageEnabled=false');
          this.showMeetingModal = true;
          this.cdr.detectChanges();
        });
      },
      error: (err) => alert('Unable to join: ' + (err?.message || err))
    });
  }

  closeMeetingModal(): void {
    this.showMeetingModal = false;
    this.meetingUrl = null;
  }

  openMeetingInNewTab(): void {
    if (this.meetingLink) window.open(this.meetingLink, '_blank');
  }

  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toLocaleString();
  }

  // Ensure endTime is after startTime and startTime is not in the past
  startEndValidator(formGroup: FormGroup) {
    const start = formGroup.get('startTime')?.value;
    const end = formGroup.get('endTime')?.value;
    const errors: any = {};

    if (start) {
      const startDate = new Date(start);
      const now = new Date();
      if (startDate.getTime() < now.getTime()) {
        errors.startInPast = true;
      }
    }

    if (start && end) {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (endDate.getTime() <= startDate.getTime()) {
        errors.endBeforeStart = true;
      }
    }

    return Object.keys(errors).length ? errors : null;
  }

  // Helpers for template
  isInvalid(controlName: string): boolean {
    const c = this.consultationForm.get(controlName);
    return !!(c && c.invalid && (c.touched || this.submitted));
  }

  getControl(controlName: string) {
    return this.consultationForm.get(controlName);
  }
}