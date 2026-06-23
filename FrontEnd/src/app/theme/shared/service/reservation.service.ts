import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of, map, catchError } from 'rxjs';
import { Reservation, TimeSlot, Provider } from '../models/reservation.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = `${environment.apiUrl}/api/reservations`;
  private providerUrl = `${environment.apiUrl}/users/providers`;
  private consultationUrl = `${environment.apiUrl}/api/consultations`;

  constructor(private http: HttpClient) {}

  // Create a new reservation
  createReservation(reservation: Reservation): Observable<Reservation> {
    return this.http.post<Reservation>(this.apiUrl, reservation);
  }

  // Update an existing reservation
  updateReservation(id: number, reservation: Reservation): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/${id}`, reservation);
  }

  // Delete a reservation
  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Get patient's reservations
  getPatientReservations(patientId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  // Get provider's reservations
  getProviderReservations(providerId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/provider/${providerId}`);
  }

  // Get pending reservations for a provider
  getPendingReservations(providerId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/provider/${providerId}/pending`);
  }

  // Get a specific reservation
  getReservation(id: number): Observable<Reservation> {
    return this.http.get<Reservation>(`${this.apiUrl}/${id}`);
  }

  // Accept a reservation
  acceptReservation(id: number): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.apiUrl}/${id}/accept`, {});
  }

  // Reject a reservation
  rejectReservation(id: number): Observable<Reservation> {
    return this.http.post<Reservation>(`${this.apiUrl}/${id}/reject`, {});
  }

  // Get all providers
  getProviders(): Observable<Provider[]> {
    return this.http.get<Provider[]>(this.providerUrl);
  }

  // Get time slots for a date
  getTimeSlots(date: string): TimeSlot[] {
    const slots: TimeSlot[] = [];
    const startHour = 8;
    const endHour = 17;

    for (let hour = startHour; hour < endHour; hour++) {
      const time = `${hour.toString().padStart(2, '0')}:00`;
      slots.push({
        time: time,
        available: true
      });
    }

    return slots;
  }

  // Get available time slots for a provider on a specific date
  getAvailableTimeSlots(providerId: number, date: string): Observable<TimeSlot[]> {
    // First, fetch all reservations and consultations for that provider
    return this.getProviderReservations(providerId).pipe(
      map(reservations => {
        const slots = this.getTimeSlots(date);
        
        // Filter reservations for the selected date
        const dateOnly = date.split('T')[0];
        const reservationsOnDate = reservations.filter(res => {
          const resDate = new Date(res.reservationDate).toISOString().split('T')[0];
          return resDate === dateOnly && (res.status === 'PENDING' || res.status === 'ACCEPTED');
        });

        // Mark unavailable slots
        reservationsOnDate.forEach(res => {
          const slotHour = parseInt(res.timeSlot.split(':')[0]);
          // Find and mark this slot as unavailable
          const slotIndex = slots.findIndex(s => {
            const sHour = parseInt(s.time.split(':')[0]);
            return sHour === slotHour;
          });
          if (slotIndex >= 0) {
            slots[slotIndex].available = false;
            slots[slotIndex].reserved = true;
          }
        });

        return slots;
      }),
      catchError(err => {
        console.error('Error fetching provider reservations:', err);
        // Return all slots as available if there's an error
        return of(this.getTimeSlots(date));
      })
    );
  }

  // Format time for display
  formatTime(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    return `${hours}:${minutes} - ${(parseInt(hours) + 1).toString().padStart(2, '0')}:${minutes}`;
  }

  // Get provider's consultations
  getProviderConsultations(providerId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.consultationUrl}/provider`);
  }

  // Get patient's consultations
  getPatientConsultations(patientId: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.consultationUrl}/patient`);
  }
}
