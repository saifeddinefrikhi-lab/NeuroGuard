import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ConsultationService } from '../../../core/services/consultation.service';
import { Consultation } from '../../../core/models/consultation.model';
import { UserDto } from '../../../core/models/user.dto';
import { MonthlyBarChartComponent } from '../../../theme/shared/apexchart/monthly-bar-chart/monthly-bar-chart.component';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-provider-consultation-history',
  standalone: true,
  imports: [CommonModule, RouterModule, MonthlyBarChartComponent],
  templateUrl: './provider-consultation-history.component.html',
  styleUrls: ['./provider-consultation-history.component.scss']
})
export class ProviderConsultationHistoryComponent implements OnInit {
  consultations: Consultation[] = [];
  patients: UserDto[] = [];
  caregivers: UserDto[] = [];
  loading = false;
  error = '';
  searchTerm = '';
  showMeetingModal = false;
  meetingUrl: SafeResourceUrl | null = null;
  meetingLink = '';
  meetingTitle = '';

  providerStats: any = null;
  chartData: number[] = [];
  chartLabels: string[] = [];

  constructor(
    private consultationService: ConsultationService,
    private sanitizer: DomSanitizer,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = '';
    this.cdr.detectChanges();
    
    forkJoin({
      consultations: this.consultationService.getMyConsultationsAsProvider(),
      stats: this.consultationService.getProviderStatistics()
    }).subscribe({
      next: ({ consultations, stats }) => {
        this.consultations = (consultations ?? []).sort((a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
        );
        this.providerStats = stats;
        this.updateChartData(stats);
        this.loading = false;
        this.cdr.detectChanges();
        this.loadPatientsAndCaregivers();
      },
      error: (err) => {
        this.error = err?.error?.message || err?.message || 'Unable to load history.';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  updateChartData(stats: any): void {
    const byType = stats?.byType || {};
    const byStatus = stats?.byStatus || {};
    this.chartData = [
      byType['ONLINE'] || 0,
      byType['PRESENTIAL'] || 0,
      byStatus['COMPLETED'] || 0,
      byStatus['SCHEDULED'] || 0
    ];
    this.chartLabels = ['Online', 'In-Person', 'Completed', 'Scheduled'];
  }

  loadPatientsAndCaregivers(): void {
    this.consultationService.getPatients().subscribe({
      next: (data) => {
        this.patients = data ?? [];
        this.cdr.detectChanges();
      },
      error: () => { /* ignore */ }
    });
    this.consultationService.getCaregivers().subscribe({
      next: (data) => {
        this.caregivers = data ?? [];
        this.cdr.detectChanges();
      },
      error: () => { /* ignore */ }
    });
  }

  onSearch(event: Event): void {
    this.searchTerm = ((event.target as HTMLInputElement).value || '').trim().toLowerCase();
  }

  filteredConsultations(): Consultation[] {
    if (!this.searchTerm) return this.consultations;
    return this.consultations.filter(c =>
      (c.title || '').toLowerCase().includes(this.searchTerm) ||
      (c.id?.toString() || '').includes(this.searchTerm)
    );
  }

  getPatientName(id: number): string {
    const p = this.patients.find(x => x.id === id);
    return p ? `${p.firstName} ${p.lastName}` : id.toString();
  }

  getCaregiverName(id: number): string {
    const c = this.caregivers.find(x => x.id === id);
    return c ? `${c.firstName} ${c.lastName}` : id.toString();
  }

  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toLocaleString('fr-FR');
  }

  get stats() {
    const list = this.consultations;
    return {
      total: list.length,
      online: list.filter(c => c.type === 'ONLINE').length,
      presential: list.filter(c => c.type === 'PRESENTIAL').length,
      scheduled: list.filter(c => c.status === 'SCHEDULED').length,
      completed: list.filter(c => c.status === 'COMPLETED').length,
      cancelled: list.filter(c => c.status === 'CANCELLED').length
    };
  }

  joinOnlineConsultation(consultation: Consultation): void {
    this.consultationService.getJoinLink(consultation.id).subscribe({
      next: (link) => {
        this.meetingTitle = consultation.title;
        this.meetingLink = link;
        this.meetingUrl = this.sanitizer.bypassSecurityTrustResourceUrl(link + '#config.prejoinPageEnabled=false');
        this.showMeetingModal = true;
        this.cdr.detectChanges();
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
}
