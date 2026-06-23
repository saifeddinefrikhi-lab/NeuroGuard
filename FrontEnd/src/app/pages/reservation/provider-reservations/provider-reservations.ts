import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReservationService, Reservation } from '../../../services/reservation.service';

@Component({
  selector: 'app-provider-reservations',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './provider-reservations.html',
  styleUrls: ['./provider-reservations.scss']
})
export class ProviderReservations implements OnInit {
  reservations: Reservation[] = [];
  isLoading = false;
  error = '';
  
  private reservationService = inject(ReservationService);
  private cdr = inject(ChangeDetectorRef);

  ngOnInit() {
    this.loadReservations();
  }

  loadReservations() {
    this.isLoading = true;
    this.error = '';
    
    // Replace with actual user ID from token
    let providerId = 1; 
    try {
      const token = localStorage.getItem('authToken');
      if (token) {
        const payload = JSON.parse(atob(token.split('.')[1]));
        if (payload.userId) providerId = parseInt(payload.userId, 10);
      }
    } catch(e) {}

    this.reservationService.getProviderReservations(providerId).subscribe(
      res => {
        this.reservations = res;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      err => {
        this.error = 'Failed to load reservations.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    );
  }

  updateStatus(id: number, status: 'ACCEPTED' | 'REJECTED') {
    this.reservationService.updateReservation(id, { status }).subscribe(
      () => this.loadReservations(),
      err => this.error = "Could not update status."
    );
  }

  deleteReservation(id: number) {
    if (confirm("Permanently delete this record?")) {
      this.reservationService.deleteReservation(id).subscribe(
        () => this.loadReservations(),
        err => this.error = "Could not delete record."
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
