import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsultationService } from '../../../core/services/consultation.service';
import { Consultation, ConsultationType } from '../../../core/models/consultation.model';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-patient-consultations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './patient-consultations.component.html',
  styleUrls: ['./patient-consultations.component.scss']
})
export class PatientConsultationsComponent implements OnInit {
  consultations: Consultation[] = [];
  loading = false;
  error = '';
  showMeetingModal = false;
  meetingUrl: SafeResourceUrl | null = null;
  meetingLink = '';
  meetingTitle = '';

  constructor(
    private consultationService: ConsultationService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    this.loadConsultations();
  }

  loadConsultations(): void {
    this.loading = true;
    this.error = '';
    this.consultationService.getMyConsultationsAsPatient().subscribe({
      next: (data) => {
        this.consultations = data;
        this.loading = false;
      },
        error: (err) => {
          this.error = err?.error?.message || err?.message || 'Unable to load consultations.';
        this.loading = false;
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

  openMeetingInNewTab(): void {
    if (this.meetingLink) window.open(this.meetingLink, '_blank');
  }

  closeMeetingModal(): void {
    this.showMeetingModal = false;
    this.meetingUrl = null;
  }

  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toLocaleString();
  }

  refresh(): void {
    this.loadConsultations();
  }
}
