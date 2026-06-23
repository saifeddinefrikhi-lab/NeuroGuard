import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ReservationService, Reservation } from '../../../services/reservation.service';

@Component({
  selector: 'app-patient-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-reservations.html',
  styleUrls: ['./patient-reservations.scss']
})
export class PatientReservations implements OnInit {
  reservations: Reservation[] = [];
  providers: any[] = [];
  
  // View state: 'LIST' or 'CREATE'
  currentView: 'LIST' | 'CREATE' = 'LIST';

  // State
  isLoading = false;
  error = '';
  success = '';

  // Form State
  selectedProvider: any = null;
  bookingDate: string = '';
  bookingNotes: string = '';
  isBooking = false;
  
  private reservationService = inject(ReservationService);
  private cdr = inject(ChangeDetectorRef);

  private getPatientId(): number {
    let patientId = 1; 
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.userId) patientId = parseInt(payload.userId, 10);
      }
    } catch(e) {}
    return patientId;
  }

  ngOnInit() {
    this.loadReservations();
    this.loadProviders();
  }

  loadReservations() {
    // Avoid NG0100 by deferring state changes if called synchronously
    setTimeout(() => {
      this.isLoading = true;
      this.error = '';
      this.cdr.detectChanges();
    });
    
    this.reservationService.getPatientReservations(this.getPatientId()).subscribe(
      res => {
        this.reservations = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      err => {
        this.error = 'Failed to load appointments.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  loadProviders() {
    this.reservationService.getProviders().subscribe(
      res => {
        this.providers = res;
        this.cdr.detectChanges();
      },
      err => console.error("Could not fetch providers.")
    );
  }

  switchView(view: 'LIST' | 'CREATE') {
    setTimeout(() => {
      this.currentView = view;
      this.error = '';
      this.success = '';
      if (view === 'CREATE') {
        this.selectedProvider = null;
        this.bookingDate = '';
        this.bookingNotes = '';
      }
      this.cdr.detectChanges();
    });

    if (view === 'LIST') {
      this.loadReservations();
    }
  }

  selectProviderForBooking(provider: any) {
    this.selectedProvider = provider;
  }

  confirmBooking() {
    if (!this.bookingDate) {
      this.error = "Please provide an appointment date and time.";
      return;
    }
    
    setTimeout(() => {
      this.isBooking = true;
      this.error = '';
      this.cdr.detectChanges();
    });
    
    const resPayload = {
       patientId: this.getPatientId(),
       providerId: this.selectedProvider.id,
       reservationDate: this.bookingDate + ':00',
       notes: this.bookingNotes
    };

    this.reservationService.createReservation(resPayload).subscribe(
       () => {
          this.isBooking = false;
          this.success = "Appointment successfully created!";
          this.cdr.detectChanges();
          setTimeout(() => this.switchView('LIST'), 2000);
       },
       () => {
          this.isBooking = false;
          this.error = "An error occurred while booking the appointment.";
          this.cdr.detectChanges();
       }
    );
  }

  cancelReservation(id: number) {
    if (confirm("Are you sure you want to cancel this appointment?")) {
      this.reservationService.deleteReservation(id).subscribe(
        () => this.loadReservations(),
        err => this.error = "Could not cancel appointment."
      );
    }
  }

  getStatusBadgeClass(status: string) {
    switch (status) {
      case 'PENDING': return 'bg-warning text-dark';
      case 'ACCEPTED': return 'bg-success';
      case 'REJECTED': return 'bg-danger';
      default: return 'bg-secondary';
    }
  }
}
