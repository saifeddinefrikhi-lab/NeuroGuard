import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { BehaviorEntry } from '../models/monitoring.models';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class BehaviorService {
    private apiUrl = `${environment.monitoringApi}/behavior`;

    constructor(private http: HttpClient) { }

    getBehaviorLogs(patientId: string): Observable<BehaviorEntry[]> {
        // TODO: return this.http.get<BehaviorEntry[]>(`${this.apiUrl}/${patientId}`);
        return of(this.getMockData());
    }

    private getMockData(): BehaviorEntry[] {
        return [
            { id: 1, date: new Date(), time: '08:30', type: 'Agitation', severity: 'Mild', notes: 'Brief agitation during morning routine', duration: 10 },
            { id: 2, date: new Date(Date.now() - 86400000), time: '19:45', type: 'Sundowning', severity: 'Moderate', notes: 'Increased confusion and restlessness at dusk', duration: 45 },
            { id: 3, date: new Date(Date.now() - 172800000), time: '14:00', type: 'Wandering', severity: 'Mild', notes: 'Found near front door, redirected calmly', duration: 5 },
            { id: 4, date: new Date(Date.now() - 259200000), time: '11:15', type: 'Confusion', severity: 'Moderate', notes: 'Did not recognize caregiver for 20 minutes', duration: 20 },
            { id: 5, date: new Date(Date.now() - 345600000), time: '22:00', type: 'Agitation', severity: 'Severe', notes: 'Refused medication, required calming intervention', duration: 30 }
        ];
    }
}
