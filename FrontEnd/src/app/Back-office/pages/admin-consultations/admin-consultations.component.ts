import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ConsultationService } from '../../../core/services/consultation.service';
import { Consultation } from '../../../core/models/consultation.model';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-admin-consultations',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-consultations.component.html',
  styleUrls: ['./admin-consultations.component.scss']
})
export class AdminConsultationsComponent implements OnInit {
  consultations: Consultation[] = [];
  loading = false;
  error = '';

  constructor(private consultationService: ConsultationService) {}

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

  ngOnInit(): void {
    this.loadConsultations();
  }

  loadConsultations(): void {
    this.loading = true;
    this.error = '';
    this.consultationService.getAllConsultations().subscribe({
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

  formatDateTime(dateTime: string): string {
    return new Date(dateTime).toLocaleString();
  }

  refresh(): void {
    this.loadConsultations();
  }
}
