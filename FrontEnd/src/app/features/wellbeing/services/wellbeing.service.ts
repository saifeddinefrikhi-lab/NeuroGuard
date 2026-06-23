import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Mood, Sleep, Hydration, PatientPulseDTO } from '../models/wellbeing.models';
import { environment } from 'src/environments/environment';

@Injectable({
    providedIn: 'root'
})
export class WellbeingService {
    private apiUrl = environment.wellbeingApi;

    constructor(private http: HttpClient) { }

    saveMood(mood: Mood): Observable<Mood> {
        return this.http.post<Mood>(`${this.apiUrl}/mood`, mood);
    }

    getMoodTrends(userId: string): Observable<Mood[]> {
        return this.http.get<Mood[]>(`${this.apiUrl}/mood/${userId}/trends`);
    }

    logSleep(sleep: Sleep): Observable<Sleep> {
        return this.http.post<Sleep>(`${this.apiUrl}/sleep`, sleep);
    }

    getAverageSleep(userId: string): Observable<number> {
        return this.http.get<number>(`${this.apiUrl}/sleep/${userId}/avg`);
    }

    addHydration(userId: string): Observable<Hydration> {
        return this.http.patch<Hydration>(`${this.apiUrl}/hydration/${userId}/add`, {});
    }

    getTodayHydration(userId: string): Observable<Hydration> {
        return this.http.get<Hydration>(`${this.apiUrl}/hydration/${userId}/today`);
    }

    getPulse(userId: string): Observable<PatientPulseDTO> {
        return this.http.get<PatientPulseDTO>(`${this.apiUrl}/pulse/${userId}`);
    }

    saveGameResult(result: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/cognitive-games/result`, result);
    }

    getGameResults(userId: string): Observable<any[]> {
        return this.http.get<any[]>(`${this.apiUrl}/cognitive-games/patient/${userId}`);
    }
}
