import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ConsultationService } from '../../../core/services/consultation.service';
import { AvailabilityService } from '../../../core/services/availability.service';
import { Consultation, ConsultationRequest, ConsultationType } from '../../../core/models/consultation.model';
import { Availability, DAY_NAMES } from '../../../core/models/availability.model';
import { UserDto } from '../../../core/models/user.dto';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-caregiver-consultations',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule],
  templateUrl: './caregiver-consultations.component.html',
  styleUrls: ['./caregiver-consultations.component.scss']
})
export class CaregiverConsultationsComponent implements OnInit {
  consultations: Consultation[] = [];
  loading = false;
  error = '';
  showMeetingModal = false;
  meetingUrl: SafeResourceUrl | null = null;
  meetingLink = '';
  meetingTitle = '';

  showForm = false;
  consultationForm: FormGroup;
  providers: UserDto[] = [];
  patients: UserDto[] = [];
  providerAvailabilities: Availability[] = [];
  providersLoading = false;
  patientsLoading = false;
  availabilitiesLoading = false;
  submitError = '';
  submitted = false;
  ConsultationType = ConsultationType;

  constructor(
    private consultationService: ConsultationService,
    private availabilityService: AvailabilityService,
    private fb: FormBuilder,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {
    this.consultationForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(255)]],
      description: ['', [Validators.maxLength(1000)]],
      startTime: ['', Validators.required],
      endTime: [''],
      type: [ConsultationType.PRESENTIAL, Validators.required],
      providerId: ['', Validators.required],
      patientId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadConsultations();
    this.loadProviders();
    this.loadPatients();
    this.consultationForm.get('providerId')?.valueChanges.subscribe(providerId => {
      const id = Number(providerId);
      if (id) this.loadProviderAvailability(id);
      else setTimeout(() => { this.providerAvailabilities = []; this.cdr.detectChanges(); });
    });
  }

  loadProviders(): void {
    this.providersLoading = true;
    this.consultationService.getProviders().subscribe({
      next: (data) => {
        this.providers = data ?? [];
        setTimeout(() => { this.providersLoading = false; this.cdr.detectChanges(); });
      },
      error: () => {
        this.providers = [];
        setTimeout(() => { this.providersLoading = false; this.cdr.detectChanges(); });
      }
    });
  }

  loadPatients(): void {
    this.patientsLoading = true;
    this.consultationService.getPatients().subscribe({
      next: (data) => {
        this.patients = data ?? [];
        setTimeout(() => { this.patientsLoading = false; this.cdr.detectChanges(); });
      },
      error: () => {
        setTimeout(() => { this.patientsLoading = false; this.cdr.detectChanges(); });
      }
    });
  }

  loadProviderAvailability(providerId: number): void {
    this.availabilitiesLoading = true;
    this.availabilityService.getProviderAvailability(providerId).subscribe({
      next: (data) => {
        this.providerAvailabilities = data ?? [];
        setTimeout(() => { this.availabilitiesLoading = false; this.cdr.detectChanges(); });
      },
      error: () => {
        this.providerAvailabilities = [];
        setTimeout(() => { this.availabilitiesLoading = false; this.cdr.detectChanges(); });
      }
    });
  }

  getDayName(day: string): string {
    return DAY_NAMES[day as keyof typeof DAY_NAMES] || day;
  }

  openCreateForm(): void {
    this.submitError = '';
    this.consultationForm.reset({ type: ConsultationType.PRESENTIAL });
    this.providerAvailabilities = [];
    this.showForm = true;
  }

  cancelForm(): void {
    this.showForm = false;
  }

  onCreateSubmit(): void {
    this.submitted = true;
    this.submitError = '';
    this.consultationForm.markAllAsTouched();
    if (this.consultationForm.invalid) return;

    const raw = this.consultationForm.value;
    const request: ConsultationRequest = {
      title: raw.title,
      description: raw.description,
      startTime: raw.startTime,
      endTime: raw.endTime || undefined,
      type: raw.type,
      patientId: Number(raw.patientId),
      providerId: Number(raw.providerId)
    };

    this.consultationService.createConsultation(request).subscribe({
      next: () => {
        this.loadConsultations();
        this.cancelForm();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.submitError = err?.error?.message || err?.message || 'This doctor is unavailable for this time slot. Please check availability.';
        this.cdr.detectChanges();
      }
    });
  }

  loadConsultations(): void {
    this.loading = true;
    this.error = '';
    this.consultationService.getMyConsultationsAsCaregiver().subscribe({
      next: (data) => {
        this.consultations = data;
        setTimeout(() => { this.loading = false; this.cdr.detectChanges(); });
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Unable to load consultations.';
        setTimeout(() => { this.loading = false; this.cdr.detectChanges(); });
      }
    });
  }

  joinOnlineConsultation(consultation: Consultation): void {
    this.consultationService.getJoinLink(consultation.id).subscribe({
      next: (link) => {
        this.meetingTitle = consultation.title;
        this.meetingLink = link;
        this.meetingUrl = this.sanitizer.bypassSecurityTrustResourceUrl(link + '#config.prejoinPageEnabled=false');
        this.showMeetingModal = true;
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

  getControl(name: string) {
    return this.consultationForm.get(name);
  }
}
