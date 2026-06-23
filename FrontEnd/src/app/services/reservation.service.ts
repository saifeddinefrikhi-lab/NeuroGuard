import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Reservation {
  id?: number;
  patientId: number;
  providerId: number;
  reservationDate: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  notes?: string;
  createdAt?: string;

  // Enriched fields
  patientName?: string;
  providerName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = `${environment.apiUrl}/api/reservations`;

  constructor(private http: HttpClient) {}

  createReservation(reservation: Partial<Reservation>): Observable<Reservation> {
    return this.http.post<Reservation>(this.apiUrl, reservation);
  }

  updateReservation(id: number, reservation: Partial<Reservation>): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/${id}`, reservation);
  }

  deleteReservation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  getPatientReservations(patientId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/patient/${patientId}`);
  }

  getProviderReservations(providerId: number): Observable<Reservation[]> {
    return this.http.get<Reservation[]>(`${this.apiUrl}/provider/${providerId}`);
  }

  // Fetch providers directly via user-service for the list & form view
  getProviders(): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/users/role/PROVIDER`);
  }
}
