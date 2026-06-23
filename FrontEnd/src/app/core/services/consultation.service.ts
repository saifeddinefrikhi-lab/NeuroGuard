// src/app/services/consultation.service.ts

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Consultation, ConsultationRequest } from '../models/consultation.model';
import { UserDto } from '../models/user.dto';

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  private baseUrl = `${environment.apiUrl}/api/consultations`; // via gateway

  constructor(private http: HttpClient) {}

  // Provider: create a consultation
  createConsultation(request: ConsultationRequest): Observable<Consultation> {
    return this.http.post<Consultation>(this.baseUrl, request);
  }

  // Provider: update a consultation
  updateConsultation(id: number, request: ConsultationRequest): Observable<Consultation> {
    return this.http.put<Consultation>(`${this.baseUrl}/${id}`, request);
  }

  // Provider: delete a consultation
  deleteConsultation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // Provider: get all consultations created by the logged-in provider
  getMyConsultationsAsProvider(): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.baseUrl}/provider`);
  }

  // Patient: get consultations where patient is the current user
  getMyConsultationsAsPatient(): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.baseUrl}/patient`);
  }

  // Caregiver: get consultations where caregiver is assigned
  getMyConsultationsAsCaregiver(): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.baseUrl}/caregiver`);
  }

  // Admin: get all consultations
  getAllConsultations(): Observable<Consultation[]> {
    return this.http.get<Consultation[]>(`${this.baseUrl}/admin`);
  }

  // Get join link for an online consultation (returns plain text)
  getJoinLink(id: number): Observable<string> {
    return this.http.get(`${this.baseUrl}/${id}/join`, { responseType: 'text' });
  }
  getPatients(): Observable<UserDto[]> {
  return this.http.get<UserDto[]>(`${environment.apiUrl}/users/role/PATIENT`);
}

getCaregivers(): Observable<UserDto[]> {
  return this.http.get<UserDto[]>(`${environment.apiUrl}/users/role/CAREGIVER`);
}

getProviders(): Observable<UserDto[]> {
  return this.http.get<UserDto[]>(`${environment.apiUrl}/users/role/PROVIDER`);
}

getAdminStatistics(): Observable<any> {
  return this.http.get<any>(`${this.baseUrl}/statistics/admin`);
}

  getProviderStatistics(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/statistics/provider`);
  }

  getReservationStatistics(): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/api/reservations/statistics/admin`);
  }
}