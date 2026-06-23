import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { SleepEntry } from '../models/monitoring.models';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class SleepService {
    private apiUrl = `${environment.monitoringApi}/sleep`;

    /** Emits whenever a new sleep entry is successfully saved */
    readonly refresh$ = new Subject<void>();

    constructor(private http: HttpClient) { }

    getSleepData(patientId: string): Observable<SleepEntry[]> {
        return this.http.get<SleepEntry[]>(`${this.apiUrl}/patient/${patientId}`);
    }

    hasSleepLoggedToday(patientId: string): Observable<boolean> {
        return this.http.get<boolean>(`${this.apiUrl}/patient/${patientId}/logged-today`);
    }

    logSleep(patientId: string, hours: number, quality: string, disturbances: number): Observable<any> {
        const payload = {
            patientId,
            duration: hours,
            quality,
            disturbances,
            timestamp: new Date()
        };
        return this.http.post(this.apiUrl, payload);
    }
}

