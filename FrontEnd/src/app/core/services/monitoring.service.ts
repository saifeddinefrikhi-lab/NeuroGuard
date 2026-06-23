import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { Sleep } from '../models/wellbeing.model';
import { MonitoringTask } from '../../features/monitoring/models/monitoring.models';

@Injectable({
    providedIn: 'root'
})
export class MonitoringService {
    private apiUrl = environment.monitoringApi;

    constructor(private http: HttpClient) { }

    logSleep(patientId: string, duration: number, quality: string, disturbances: number): Observable<any> {
        const payload = {
            patientId,
            duration,
            quality,
            disturbances,
            timestamp: new Date()
        };
        return this.http.post(`${this.apiUrl}/sleep`, payload);
    }

    // Future monitoring endpoints can be added here
    getLatestSleep(userId: string): Observable<Sleep> {
        return this.http.get<Sleep>(`${this.apiUrl}/sleep/${userId}/latest`);
    }

    // ==========================================
    // PATIENT TASKS (Assigned by Caregiver)
    // ==========================================
    getPatientTasks(patientId: string): Observable<MonitoringTask[]> {
        return this.http.get<MonitoringTask[]>(`${this.apiUrl}/tasks/patient/${patientId}`);
    }

    createPatientTask(patientId: string, task: Partial<MonitoringTask>): Observable<MonitoringTask> {
        return this.http.post<MonitoringTask>(`${this.apiUrl}/tasks/patient/${patientId}`, task);
    }

    togglePatientTask(taskId: number | string): Observable<MonitoringTask> {
        return this.http.patch<MonitoringTask>(`${this.apiUrl}/tasks/patient/task/${taskId}/toggle`, {});
    }

    deletePatientTask(taskId: number | string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/tasks/patient/task/${taskId}`);
    }

    // ==========================================
    // CAREGIVER CHECKLIST (Personal Tasks)
    // ==========================================
    getCaregiverTasks(caregiverId: string): Observable<MonitoringTask[]> {
        return this.http.get<MonitoringTask[]>(`${this.apiUrl}/tasks/caregiver/${caregiverId}`);
    }

    createCaregiverTask(caregiverId: string, task: Partial<MonitoringTask>): Observable<MonitoringTask> {
        return this.http.post<MonitoringTask>(`${this.apiUrl}/tasks/caregiver/${caregiverId}`, task);
    }

    toggleCaregiverTask(taskId: number | string): Observable<MonitoringTask> {
        return this.http.patch<MonitoringTask>(`${this.apiUrl}/tasks/caregiver/task/${taskId}/toggle`, {});
    }

    deleteCaregiverTask(taskId: number | string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/tasks/caregiver/task/${taskId}`);
    }
}
