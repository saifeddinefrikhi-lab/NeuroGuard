// user-management.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserDto } from '../models/user.dto';
import { UserStatsDto } from '../models/user-stats.dto';
import { CreateUserRequest, UpdateUserRequest } from '../models/user-request.dto';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private baseUrl = `${environment.apiUrl}/users`;  // through gateway

  constructor(private http: HttpClient) {}

  // Get user stats by role (admin only)
  getStats(): Observable<UserStatsDto> {
    return this.http.get<UserStatsDto>(`${this.baseUrl}/dashboard/stats`);
  }

  // Get all users (admin only)
  getAllUsers(): Observable<UserDto[]> {
    return this.http.get<UserDto[]>(this.baseUrl);
  }

  // Get user by ID (public or admin) – already exists but we can add for completeness
  getUserById(id: number): Observable<UserDto> {
    return this.http.get<UserDto>(`${this.baseUrl}/${id}`);
  }

  // Create a new user (admin only)
  createUser(request: CreateUserRequest): Observable<UserDto> {
    return this.http.post<UserDto>(this.baseUrl, request);
  }

  // Update an existing user (admin only)
  updateUser(id: number, request: UpdateUserRequest): Observable<UserDto> {
    return this.http.put<UserDto>(`${this.baseUrl}/${id}`, request);
  }

  // Delete a user (admin only)
  deleteUser(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /**
   * Export user list as PDF. Optional role filter (e.g. PATIENT, PROVIDER).
   * Returns blob for download.
   */
  getUsersPdf(role?: string): Observable<Blob> {
    let url = `${this.baseUrl}/dashboard/export/pdf`;
    if (role && role.trim()) {
      url += `?role=${encodeURIComponent(role.trim())}`;
    }
    return this.http.get(url, { responseType: 'blob' });
  }
}