import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';

export interface Pharmacy {
  id?: number;
  name: string;
  address: string;
  phoneNumber: string;
  latitude: number;
  longitude: number;
  description?: string;
  openNow?: boolean;
  openingTime?: string;
  closingTime?: string;
  email?: string;
  hasDelivery?: boolean;
  accepts24h?: boolean;
  specialities?: string;
  imageUrl?: string;
  distance?: number; // Distance from patient location in km
}

export interface Clinic {
  id?: number;
  name: string;
  address: string;
  phoneNumber: string;
  latitude: number;
  longitude: number;
  description?: string;
  openNow?: boolean;
  openingTime?: string;
  closingTime?: string;
  email?: string;
  emergencyService?: boolean;
  acceptsInsurance?: boolean;
  specialities?: string;
  imageUrl?: string;
  distance?: number;
}

export interface PharmacyLocationRequest {
  patientLatitude: number;
  patientLongitude: number;
  radiusKm?: number;
  openNowOnly?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PharmacyService {

  private apiUrl = `${environment.pharmacyApiUrl}/api/pharmacies`;

  constructor(private httpClient: HttpClient) { }

  /**
   * Get all pharmacies
   */
  getAllPharmacies(): Observable<Pharmacy[]> {
    return this.httpClient.get<Pharmacy[]>(this.apiUrl);
  }

  /**
   * Get pharmacy by ID
   */
  getPharmacyById(id: number): Observable<Pharmacy> {
    return this.httpClient.get<Pharmacy>(`${this.apiUrl}/${id}`);
  }

  /**
   * Find nearby pharmacies for a given patient location
   * @param patientLatitude Latitude of patient location
   * @param patientLongitude Longitude of patient location
   * @param radiusKm Search radius in kilometers (default: 10)
   * @param openNowOnly Only show open pharmacies (default: false)
   */
  findNearbyPharmacies(
    patientLatitude: number,
    patientLongitude: number,
    radiusKm: number = 10,
    openNowOnly: boolean = false
  ): Observable<Pharmacy[]> {
    const request: PharmacyLocationRequest = {
      patientLatitude,
      patientLongitude,
      radiusKm,
      openNowOnly
    };
    return this.httpClient.post<Pharmacy[]>(`${this.apiUrl}/nearby`, request);
  }

  /**
   * Search pharmacies by name
   */
  searchByName(name: string): Observable<Pharmacy[]> {
    return this.httpClient.get<Pharmacy[]>(`${this.apiUrl}/search`, {
      params: { name }
    });
  }

  /**
   * Get all currently open pharmacies
   */
  getOpenPharmacies(): Observable<Pharmacy[]> {
    return this.httpClient.get<Pharmacy[]>(`${this.apiUrl}/open`);
  }

  /**
   * Get pharmacies with delivery service
   */
  getPharmaciesWithDelivery(): Observable<Pharmacy[]> {
    return this.httpClient.get<Pharmacy[]>(`${this.apiUrl}/delivery`);
  }

  /**
   * Get 24-hour pharmacies
   */
  get24HourPharmacies(): Observable<Pharmacy[]> {
    return this.httpClient.get<Pharmacy[]>(`${this.apiUrl}/24hours`);
  }

  /**
   * Create a new pharmacy (Admin only)
   */
  createPharmacy(pharmacy: Pharmacy): Observable<Pharmacy> {
    return this.httpClient.post<Pharmacy>(this.apiUrl, pharmacy);
  }

  /**
   * Update pharmacy (Admin only)
   */
  updatePharmacy(id: number, pharmacy: Pharmacy): Observable<Pharmacy> {
    return this.httpClient.put<Pharmacy>(`${this.apiUrl}/${id}`, pharmacy);
  }

  /**
   * Delete pharmacy (Admin only)
   */
  deletePharmacy(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Calculate distance between two geographic points using Haversine formula
   * @param lat1 Latitude of first point
   * @param lon1 Longitude of first point
   * @param lat2 Latitude of second point
   * @param lon2 Longitude of second point
   * @returns Distance in kilometers
   */
  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const earthRadiusKm = 6371;

    const dLat = this.degreesToRadians(lat2 - lat1);
    const dLon = this.degreesToRadians(lon2 - lon1);

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.degreesToRadians(lat1)) * Math.cos(this.degreesToRadians(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.asin(Math.sqrt(a));
    const distance = earthRadiusKm * c;

    return Math.round(distance * 100) / 100;
  }

  /**
   * Convert degrees to radians
   */
  private degreesToRadians(degrees: number): number {
    return degrees * (Math.PI / 180);
  }

  /**
   * Get user's current location using Geolocation API
   */
  getCurrentLocation(): Promise<{ latitude: number; longitude: number }> {
    return new Promise((resolve, reject) => {
      if ('geolocation' in navigator) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude
            });
          },
          (error) => {
            reject(error);
          }
        );
      } else {
        reject(new Error('Geolocation is not supported by this browser'));
      }
    });
  }

  getAllClinics(): Observable<Clinic[]> {
    return this.httpClient.get<Clinic[]>(`${this.apiUrl}/clinics`);
  }

  getClinicById(id: number): Observable<Clinic> {
    return this.httpClient.get<Clinic>(`${this.apiUrl}/clinics/${id}`);
  }

  findNearbyClinics(
    patientLatitude: number,
    patientLongitude: number,
    radiusKm: number = 10,
    openNowOnly: boolean = false
  ): Observable<Clinic[]> {
    const request: PharmacyLocationRequest = {
      patientLatitude,
      patientLongitude,
      radiusKm,
      openNowOnly
    };
    return this.httpClient.post<Clinic[]>(`${this.apiUrl}/clinics/nearby`, request);
  }

  searchClinicsByName(name: string): Observable<Clinic[]> {
    return this.httpClient.get<Clinic[]>(`${this.apiUrl}/clinics/search`, {
      params: { name }
    });
  }

  getEmergencyClinics(): Observable<Clinic[]> {
    return this.httpClient.get<Clinic[]>(`${this.apiUrl}/clinics/emergency`);
  }

  getInsuranceClinics(): Observable<Clinic[]> {
    return this.httpClient.get<Clinic[]>(`${this.apiUrl}/clinics/insurance`);
  }

  /**
   * Create a new clinic (Admin only)
   */
  createClinic(clinic: Clinic): Observable<Clinic> {
    return this.httpClient.post<Clinic>(`${this.apiUrl}/clinics`, clinic);
  }

  /**
   * Update clinic (Admin only)
   */
  updateClinic(id: number, clinic: Clinic): Observable<Clinic> {
    return this.httpClient.put<Clinic>(`${this.apiUrl}/clinics/${id}`, clinic);
  }

  /**
   * Delete clinic (Admin only)
   */
  deleteClinic(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.apiUrl}/clinics/${id}`);
  }
}
