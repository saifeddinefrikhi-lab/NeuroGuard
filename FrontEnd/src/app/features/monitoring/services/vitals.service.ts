import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';
import { VitalsEntry } from '../models/monitoring.models';
import { environment } from 'src/environments/environment';

@Injectable({ providedIn: 'root' })
export class VitalsService {
    private apiUrl = `${environment.monitoringApi}/vitals`;

    constructor(private http: HttpClient) { }

    getVitals(patientId: string): Observable<VitalsEntry[]> {
        return this.http.get<VitalsEntry[]>(`${this.apiUrl}/${patientId}`);
    }

    getLatestVitals(patientId: string): Observable<VitalsEntry> {
        // Use a timestamp parameter to prevent aggressive browser caching
        const noCache = `?t=${new Date().getTime()}`;
        return this.http.get<any>(`${this.apiUrl}/${patientId}/latest${noCache}`).pipe(
            map(response => {
                return {
                    heartRate: response.heartRate,
                    bloodPressure: {
                        systolic: response.systolicBloodPressure,
                        diastolic: response.diastolicBloodPressure
                    },
                    temperature: response.temperature,
                    oxygenSaturation: response.oxygenSaturation,
                    timestamp: new Date(response.timestamp),
                    status: response.status
                } as VitalsEntry;
            })
        );
    }

    sendReport(patientId: string): Observable<string> {
        return this.http.post(`${environment.monitoringApi}/reports/generate/${patientId}`, {}, { responseType: 'text' });
    }

    private getMockVitals(): VitalsEntry[] {
        return [
            {
                heartRate: 72,
                bloodPressure: { systolic: 120, diastolic: 80 },
                temperature: 36.6,
                oxygenSaturation: 98,
                timestamp: new Date(),
                status: 'normal'
            }
        ];
    }
}
