import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { WellbeingService } from '../../../../core/services/wellbeing.service';
import { MonitoringService } from '../../../../core/services/monitoring.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PatientPulseDTO } from '../../../../core/models/wellbeing.model';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

@Component({
    selector: 'app-wellbeing-dashboard',
    standalone: false,
    templateUrl: './wellbeing-dashboard.component.html',
    styleUrl: './wellbeing-dashboard.component.scss'
})
export class WellbeingDashboardComponent implements OnInit {
    userRole: 'patient' | 'caregiver' | 'admin' = 'patient';
    pulseData: PatientPulseDTO | null = null;

    constructor(
        private router: Router,
        private wellbeingService: WellbeingService,
        private monitoringService: MonitoringService,
        private authService: AuthService
    ) { }

    ngOnInit() {
        const url = this.router.url;
        if (url.includes('/caregiver/')) {
            this.userRole = 'caregiver';
        } else if (url.includes('/admin/')) {
            this.userRole = 'admin';
        } else {
            this.userRole = 'patient';
        }

        this.loadData();
    }

    loadData() {
        const user = this.authService.currentUser;
        if (user) {
            forkJoin({
                pulse: this.wellbeingService.getPatientPulse(user.userId.toString()),
                sleep: this.monitoringService.getLatestSleep(user.userId.toString()).pipe(catchError(() => of(null)))
            }).subscribe({
                next: (results) => {
                    const data = results.pulse;
                    const latestSleep = results.sleep;

                    if (latestSleep) {
                        const dur = (latestSleep as any).duration || latestSleep.hours || 0;
                        data.sleepValue = `${dur}h`;
                        data.sleepQuality = latestSleep.quality;
                    } else {
                        data.sleepValue = 'N/A';
                    }

                    this.pulseData = data;
                },
                error: (err) => console.error('Error fetching dashboard data', err)
            });
        }
    }

    get isPatient(): boolean {
        return this.userRole === 'patient';
    }

    get isCaregiver(): boolean {
        return this.userRole === 'caregiver' || this.userRole === 'admin';
    }
}
