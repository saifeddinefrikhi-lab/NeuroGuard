import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { trigger, transition, style, animate } from '@angular/animations';
import { ReservationService } from '../../../shared/services/reservation.service';
import { AuthService } from '../../../../app/core/services/auth.service';
import { Reservation } from '../../../shared/models/reservation.model';

@Component({
  selector: 'app-provider-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './provider-reservations.component.html',
  styleUrls: ['./provider-reservations.component.scss'],
  animations: [
    trigger('fadeInOut', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-in', style({ opacity: 1 }))
      ]),
      transition(':leave', [
        animate('300ms ease-out', style({ opacity: 0 }))
      ])
    ])
  ]
})
export class ProviderReservationsComponent implements OnInit {
  reservations: Reservation[] = [];
  consultations: any[] = [];
  filteredReservations: Reservation[] = [];
  selectedReservation: Reservation | null = null;
  showDetailView = false;
  filterStatus: string = 'ALL';
  currentView: 'reservations' | 'consultations' = 'reservations';
  currentUserId: number = 0;
  loadingAction: { [key: number]: boolean } = {};
  
  // Stats to avoid NG0100 error
  pendingCount: number = 0;
  acceptedCount: number = 0;
  rejectedCount: number = 0;

  constructor(
    private reservationService: ReservationService,
    private authService: AuthService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.currentUserId = this.authService.getCurrentUserId() ?? 0;
    if (this.currentUserId === 0) {
      console.warn('WARNING: Current provider ID is 0 - user may not be properly authenticated!');
      // Wait for provider to be properly authenticated before loading
      this.authService.isLoggedIn$.subscribe(isLoggedIn => {
        if (isLoggedIn) {
          this.currentUserId = this.authService.getCurrentUserId() ?? 0;
          if (this.currentUserId > 0) {
            console.log('Provider authenticated, loading reservations with ID:', this.currentUserId);
            this.loadReservations();
          }
        }
      });
    } else {
      this.loadReservations();
    }
  }

  loadReservations(): void {
    console.log('Loading reservations for provider ID:', this.currentUserId);
    this.reservationService.getProviderReservations(this.currentUserId).subscribe({
      next: (data) => {
        console.log('Reservations loaded for provider:', data);
        this.reservations = data || [];
        this.updateStats();
        this.applyFilter();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading reservations:', err)
    });
    
    // Also load consultations
    this.loadConsultations();
  }

  loadConsultations(): void {
    console.log('Loading consultations for provider ID:', this.currentUserId);
    this.reservationService.getProviderConsultations(this.currentUserId).subscribe({
      next: (data) => {
        console.log('Consultations loaded for provider:', data);
        this.consultations = data || [];
      },
      error: (err) => console.error('Error loading consultations:', err)
    });
  }

  acceptReservation(id: number, event?: Event): void {
    if (event) event.stopPropagation();

    if (!id) return;

    this.loadingAction[id] = true;
    this.cdr.markForCheck();
    this.reservationService.acceptReservation(id).subscribe({
      next: () => {
        alert('Reservation accepted! Consultation has been created automatically.');
        setTimeout(() => {
          this.loadingAction[id] = false;
          this.cdr.markForCheck();
          this.loadReservations();
          this.closeDetailView();
        }, 0);
      },
      error: (err) => {
        alert('Error accepting reservation: ' + err.message);
        setTimeout(() => {
          this.loadingAction[id] = false;
          this.cdr.markForCheck();
        }, 0);
      }
    });
  }

  rejectReservation(id: number, event?: Event): void {
    if (event) event.stopPropagation();

    if (!id) return;

    if (!confirm('Are you sure you want to reject this reservation?')) return;

    this.loadingAction[id] = true;
    this.cdr.markForCheck();
    this.reservationService.rejectReservation(id).subscribe({
      next: () => {
        alert('Reservation rejected.');
        setTimeout(() => {
          this.loadingAction[id] = false;
          this.cdr.markForCheck();
          this.loadReservations();
          this.closeDetailView();
        }, 0);
      },
      error: (err) => {
        alert('Error rejecting reservation: ' + err.message);
        setTimeout(() => {
          this.loadingAction[id] = false;
          this.cdr.markForCheck();
        }, 0);
      }
    });
  }

  deleteReservation(id: number, event?: Event): void {
    if (event) event.stopPropagation();

    if (!id) return;

    if (!confirm('Are you sure you want to delete this reservation?')) return;

    this.loadingAction[id] = true;
    this.cdr.markForCheck();
    this.reservationService.deleteReservation(id).subscribe({
      next: () => {
        alert('Reservation deleted.');
        setTimeout(() => {
          this.loadingAction[id] = false;
          this.cdr.markForCheck();
          this.loadReservations();
        }, 0);
      },
      error: (err) => {
        console.error('Delete error:', err);
        alert('Error deleting reservation: ' + err.message);
        setTimeout(() => {
          this.loadingAction[id] = false;
          this.cdr.markForCheck();
        }, 0);
      }
    });
  }

  viewDetails(reservation: Reservation): void {
    this.selectedReservation = { ...reservation };
    this.showDetailView = true;
  }

  updateStats(): void {
    this.pendingCount = this.reservations.filter(r => r.status === 'PENDING').length;
    this.acceptedCount = this.reservations.filter(r => r.status === 'ACCEPTED').length;
    this.rejectedCount = this.reservations.filter(r => r.status === 'REJECTED').length;
  }

  applyFilter(): void {
    if (this.filterStatus === 'ALL') {
      this.filteredReservations = [...this.reservations];
    } else {
      this.filteredReservations = this.reservations.filter(r => r.status === this.filterStatus);
    }
  }

  closeDetailView(): void {
    this.showDetailView = false;
    this.selectedReservation = null;
  }

  getStatusBadge(status: string): string {
    const statusMap: any = {
      'PENDING': 'badge-warning',
      'ACCEPTED': 'badge-success',
      'REJECTED': 'badge-danger',
      'DELETED': 'badge-secondary',
      'COMPLETED': 'badge-info'
    };
    return statusMap[status] || 'badge-secondary';
  }

  getStatusText(status: string): string {
    const statusMap: any = {
      'PENDING': 'Pending',
      'ACCEPTED': 'Accepted',
      'REJECTED': 'Rejected',
      'DELETED': 'Deleted',
      'COMPLETED': 'Completed'
    };
    return statusMap[status] || status;
  }

  getConsultationTypeDisplay(type: string): string {
    return type === 'ONLINE' ? 'Online' : 'In-Person';
  }

  isActionDisabled(status: string): boolean {
    return status !== 'PENDING';
  }

  switchView(view: 'reservations' | 'consultations'): void {
    this.currentView = view;
    if (view === 'consultations') {
      this.loadConsultations();
    }
  }

  parseInt(value: string): number {
    return parseInt(value, 10);
  }
}
