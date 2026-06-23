import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Subscription, interval, combineLatest } from 'rxjs';
import { switchMap, startWith, catchError, filter } from 'rxjs/operators';
import { of } from 'rxjs';
import { VitalsService } from '../../services/vitals.service';
import { VitalsEntry } from '../../models/monitoring.models';
import { PatientContextService } from '../../../../core/services/patient-context.service';

@Component({
    selector: 'app-vitals-overview',
    standalone: false,
    templateUrl: './vitals-overview.component.html',
    styleUrls: ['./vitals-overview.component.scss']
})
export class VitalsOverviewComponent implements OnInit, OnDestroy {
    vitals: VitalsEntry | null = null;
    loading = true;
    vitalCards: any[] = [];
    private pollSubscription: Subscription | null = null;

    /** Refresh vitals every 5 minutes — matches backend simulation cadence */
    private readonly POLL_INTERVAL_MS = 5 * 60 * 1000; // 300 000 ms

    constructor(
        private vitalsService: VitalsService,
        private patientContext: PatientContextService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        console.log('VitalsOverview: Starting reactive polling...');
        
        // Combine the patient context with a recurring interval
        this.pollSubscription = combineLatest([
            this.patientContext.patientId$.pipe(filter(id => !!id)),
            interval(this.POLL_INTERVAL_MS).pipe(startWith(0))
        ]).pipe(
            switchMap(([patientId]) => {
                console.log(`VitalsOverview: Fetching for patient ${patientId}`);
                this.loading = true;
                return this.vitalsService.getLatestVitals(patientId).pipe(
                    catchError(err => {
                        console.error('API Error in real-time vitals', err);
                        return of(null);
                    })
                );
            })
        ).subscribe(data => {
            if (data) {
                this.vitals = data;
                this.buildCards();
            } else {
                this.vitals = null;
                this.vitalCards = [];
            }
            this.loading = false;
            this.cdr.detectChanges();
        });
    }

    ngOnDestroy() {
        if (this.pollSubscription) {
            this.pollSubscription.unsubscribe();
        }
    }

    private buildCards() {
        if (!this.vitals) return;
        this.vitalCards = [
            {
                title: 'Heart Rate',
                value: `${this.vitals.heartRate} BPM`,
                icon: 'favorite',
                color: '#ff5370',
                bgColor: 'rgba(255, 83, 112, 0.12)',
                status: this.vitals.heartRate >= 60 && this.vitals.heartRate <= 100 ? 'Normal' : 'Warning',
                range: '60–100 BPM',
                trend: 'stable'
            },
            {
                title: 'Blood Pressure',
                value: `${this.vitals.bloodPressure.systolic}/${this.vitals.bloodPressure.diastolic}`,
                icon: 'show_chart',
                color: '#4099ff',
                bgColor: 'rgba(64, 153, 255, 0.12)',
                status: this.vitals.bloodPressure.systolic <= 130 ? 'Normal' : 'Elevated',
                range: '< 130/85 mmHg',
                trend: 'up'
            },
            {
                title: 'Temperature',
                value: `${this.vitals.temperature}°C`,
                icon: 'thermostat',
                color: '#ffb64d',
                bgColor: 'rgba(255, 182, 77, 0.12)',
                status: this.vitals.temperature >= 36 && this.vitals.temperature <= 37.5 ? 'Normal' : 'Fever',
                range: '36.0–37.5°C',
                trend: 'stable'
            },
            {
                title: 'Oxygen (SpO2)',
                value: `${this.vitals.oxygenSaturation}%`,
                icon: 'water_drop',
                color: '#2ed8b6',
                bgColor: 'rgba(46, 216, 182, 0.12)',
                status: this.vitals.oxygenSaturation >= 95 ? 'Normal' : 'Low',
                range: '≥ 95%',
                trend: 'stable'
            }
        ];
    }

    getTrendIcon(trend: string): string {
        return trend === 'up' ? 'trending_up' : trend === 'down' ? 'trending_down' : 'remove';
    }

    getStatusClass(status: string): string {
        return status === 'Normal' ? 'good' : status === 'Elevated' || status === 'Warning' ? 'moderate' : 'poor';
    }
}
