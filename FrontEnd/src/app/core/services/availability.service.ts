import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Availability, AvailabilityRequest } from '../models/availability.model';

@Injectable({ providedIn: 'root' })
export class AvailabilityService {
  private baseUrl = `${environment.apiUrl}/api/availability`;

  constructor(private http: HttpClient) {}

  getMyAvailability(): Observable<Availability[]> {
    return this.http.get<Availability[]>(`${this.baseUrl}/me`);
  }

  getProviderAvailability(providerId: number): Observable<Availability[]> {
    return this.http.get<Availability[]>(`${this.baseUrl}/provider/${providerId}`);
  }

  create(request: AvailabilityRequest): Observable<Availability> {
    return this.http.post<Availability>(this.baseUrl, request);
  }

  update(id: number, request: AvailabilityRequest): Observable<Availability> {
    return this.http.put<Availability>(`${this.baseUrl}/${id}`, request);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
