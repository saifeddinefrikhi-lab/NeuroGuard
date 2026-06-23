import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ReservationService } from '../../../shared/services/reservation.service';
import { AuthService } from './../../../../app/core/services/auth.service';
import { Reservation, Provider, TimeSlot } from '../../../shared/models/reservation.model';

@Component({
  selector: 'app-patient-reservations',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './patient-reservations.component.html',
  styleUrls: ['./patient-reservations.component.scss'],
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
export class PatientReservationsComponent implements OnInit {
  reservations: Reservation[] = [];
  providers: Provider[] = [];
  selectedProvider: Provider | null = null;
  selectedReservation: Reservation | null = null;
  showCreateForm = false;
  showDetailView = false;
  timeSlots: TimeSlot[] = [];
  filteredReservations: Reservation[] = [];
  filterStatus: string = 'ALL';
  today: string = '';

  reservationForm: FormGroup;
  currentUserId: number = 0;

  constructor(
    private reservationService: ReservationService,
    private authService: AuthService,
    private fb: FormBuilder,
    private route: ActivatedRoute
  ) {
    this.reservationForm = this.fb.group({
      providerId: ['', Validators.required],
      reservationDate: ['', Validators.required],
      timeSlot: ['', Validators.required],
      consultationType: ['ONLINE', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    // Set today's date for min attribute
    const now = new Date();
    this.today = now.toISOString().split('T')[0];

    this.currentUserId = this.authService.getCurrentUserId() ?? 0;
    console.log('Current user ID:', this.currentUserId);
    if (this.currentUserId === 0) {
      console.warn('WARNING: Current user ID is 0 - user may not be properly authenticated!');
      // Wait for user to be properly authenticated before loading
      this.authService.isLoggedIn$.subscribe(isLoggedIn => {
        if (isLoggedIn) {
          this.currentUserId = this.authService.getCurrentUserId() ?? 0;
          if (this.currentUserId > 0) {
            console.log('User authenticated, loading reservations with ID:', this.currentUserId);
            this.loadReservations();
          }
        }
      });
    } else {
      this.loadReservations();
    }
    this.loadProviders();
    this.checkForExternalBooking();
  }

  private checkForExternalBooking(): void {
    this.route.queryParams.subscribe(params => {
      const providerId = params['providerId'];
      if (providerId) {
        console.log('Detected external booking request for provider:', providerId);
        const id = parseInt(providerId, 10);
        this.showCreateForm = true;
        this.reservationForm.patchValue({ providerId: id });
        
        // Ensure availability check is triggered if a date is set (though date will likely be empty)
        this.onProviderChange();
        
        // Find and set selectedProvider for template display
        this.selectProviderWhenLoaded(id);
      }
    });
  }

  private selectProviderWhenLoaded(id: number): void {
    if (this.providers && this.providers.length > 0) {
      const found = this.providers.find(p => p.id === id);
      if (found) {
        console.log('Pre-selecting provider for display:', found.firstName, found.lastName);
        this.selectProviderForBooking(found);
      }
    } else {
      // Re-check after a short delay if providers are still loading
      setTimeout(() => this.selectProviderWhenLoaded(id), 200);
    }
  }

  loadReservations(): void {
    console.log('Loading reservations for patient ID:', this.currentUserId);
    this.reservationService.getPatientReservations(this.currentUserId).subscribe({
      next: (data) => {
        console.log('Reservations loaded:', data);
        console.log('Number of reservations:', data.length);
        this.reservations = data;
        this.applyFilter();
        console.log('Filtered reservations:', this.filteredReservations);
      },
      error: (err) => console.error('Error loading reservations:', err)
    });
  }

  loadProviders(): void {
    this.reservationService.getProviders().subscribe({
      next: (data) => {
        this.providers = data;
      },
      error: (err) => console.error('Error loading providers:', err)
    });
  }

  onDateChange(date: string): void {
    // Get the selected provider ID
    const providerId = this.reservationForm.get('providerId')?.value;
    
    if (providerId && date) {
      console.log('Checking availability for provider', providerId, 'on date', date);
      // Fetch available slots checking provider's existing reservations
      this.reservationService.getAvailableTimeSlots(providerId, date).subscribe({
        next: (slots) => {
          console.log('Available slots for date:', slots);
          this.timeSlots = slots;
          this.reservationForm.get('timeSlot')?.reset();
        },
        error: (err) => {
          console.error('Error fetching available slots:', err);
          // Fallback to all slots available
          this.timeSlots = this.reservationService.getTimeSlots(date);
        }
      });
    } else {
      // Fallback to simple time slots if no provider selected
      this.timeSlots = this.reservationService.getTimeSlots(date);
      this.reservationForm.get('timeSlot')?.reset();
    }
  }

  onProviderChange(): void {
    const providerId = this.reservationForm.get('providerId')?.value;
    if (providerId) {
      this.selectedProvider = this.providers.find(p => p.id === parseInt(providerId, 10)) || null;
    }

    // If a date is already selected, refresh the available slots for the new provider
    const selectedDate = this.reservationForm.get('reservationDate')?.value;
    if (selectedDate) {
      this.onDateChange(selectedDate);
    }
  }

  selectProviderForBooking(provider: Provider): void {
    this.selectedProvider = provider;
    this.reservationForm.patchValue({ providerId: provider.id });
    this.onProviderChange();
  }

  createReservation(): void {
    if (this.reservationForm.invalid) {
      alert('Please fill all required fields');
      return;
    }

    const formValue = this.reservationForm.value;
    
    // Combine date and timeSlot into a LocalDateTime format
    const dateStr = formValue.reservationDate; // "YYYY-MM-DD"
    const timeStr = formValue.timeSlot; // "HH:mm"
    const reservationDateTime = `${dateStr}T${timeStr}:00`; // "YYYY-MM-DDTHH:mm:00"

    const reservation: Reservation = {
      patientId: this.currentUserId,
      providerId: formValue.providerId,
      reservationDate: reservationDateTime, // Send as ISO format
      timeSlot: formValue.timeSlot, // Keep as HH:mm
      consultationType: formValue.consultationType,
      notes: formValue.notes,
      status: 'PENDING'
    };

    console.log('Creating reservation with patient ID:', this.currentUserId);
    console.log('Creating reservation with data:', reservation);

    this.reservationService.createReservation(reservation).subscribe({
      next: (response) => {
        console.log('Reservation created successfully:', response);
        alert('Reservation created successfully!');
        this.showCreateForm = false;
        this.reservationForm.reset({ consultationType: 'ONLINE' });
        console.log('Calling loadReservations after create...');
        this.loadReservations();
      },
      error: (err) => {
        console.error('Error creating reservation:', err);
        alert('Error creating reservation: ' + err.message);
      }
    });
  }

  updateReservation(): void {
    if (!this.selectedReservation || !this.selectedReservation.id) return;

    if (this.selectedReservation.status !== 'PENDING') {
      alert('Can only update pending reservations');
      return;
    }

    // Ensure proper date format for the backend
    const dateStr = this.selectedReservation.reservationDate.split('T')[0]; // Extract date part if ISO format
    const timeStr = this.selectedReservation.timeSlot;
    const reservationDateTime = `${dateStr}T${timeStr}:00`;

    const updateData = {
      ...this.selectedReservation,
      reservationDate: reservationDateTime
    };

    this.reservationService.updateReservation(this.selectedReservation.id, updateData).subscribe({
      next: () => {
        alert('Reservation updated successfully!');
        this.showDetailView = false;
        this.selectedReservation = null;
        this.loadReservations();
      },
      error: (err) => alert('Error updating reservation: ' + err.message)
    });
  }

  deleteReservation(id: number): void {
    if (!confirm('Are you sure you want to delete this reservation?')) return;

    this.reservationService.deleteReservation(id).subscribe({
      next: () => {
        alert('Reservation deleted successfully!');
        this.loadReservations();
      },
      error: (err) => alert('Error deleting reservation: ' + err.message)
    });
  }

  viewDetails(reservation: Reservation): void {
    this.selectedReservation = { ...reservation };
    this.showDetailView = true;
    if (this.selectedReservation.timeSlot) {
      this.timeSlots = this.reservationService.getTimeSlots(this.selectedReservation.reservationDate);
    }
  }

  applyFilter(): void {
    if (this.filterStatus === 'ALL') {
      this.filteredReservations = this.reservations;
    } else {
      this.filteredReservations = this.reservations.filter(r => r.status === this.filterStatus);
    }
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

  getProviderName(providerId: number): string {
    const provider = this.providers.find(p => p.id === providerId);
    return provider ? `${provider.firstName} ${provider.lastName}` : 'Unknown Provider';
  }

  closeDetailView(): void {
    this.showDetailView = false;
    this.selectedReservation = null;
  }

  cancelForm(): void {
    this.showCreateForm = false;
    this.reservationForm.reset({ consultationType: 'ONLINE' });
  }

  parseInt(value: string): number {
    return parseInt(value, 10);
  }
}
