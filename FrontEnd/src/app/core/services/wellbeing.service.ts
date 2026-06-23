import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Mood, Sleep, Hydration, PatientPulseDTO } from '../models/wellbeing.model';

@Injectable({
    providedIn: 'root'
})
export class WellbeingService {
    private apiUrl = environment.wellbeingApi;

    constructor(private http: HttpClient) { }

    // Mood
    saveMood(mood: Mood): Observable<Mood> {
        return this.http.post<Mood>(`${this.apiUrl}/mood`, mood);
    }

    getMoodTrends(userId: string): Observable<Mood[]> {
        return this.http.get<Mood[]>(`${this.apiUrl}/mood/${userId}/trends`);
    }

    getLatestMood(userId: string): Observable<Mood> {
        return this.http.get<Mood>(`${this.apiUrl}/mood/${userId}/latest`);
    }

    // Hydration
    addHydration(userId: string): Observable<Hydration> {
        return this.http.patch<Hydration>(`${this.apiUrl}/hydration/${userId}/add`, {});
    }

    getTodayHydration(userId: string): Observable<Hydration> {
        return this.http.get<Hydration>(`${this.apiUrl}/hydration/${userId}/today`);
    }

    resetHydration(userId: string): Observable<Hydration> {
        return this.http.patch<Hydration>(`${this.apiUrl}/hydration/${userId}/reset`, {});
    }

    // Aggregate Pulse
    getPatientPulse(userId: string): Observable<PatientPulseDTO> {
        return this.http.get<PatientPulseDTO>(`${this.apiUrl}/pulse/${userId}`);
    }
}
