import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { WellbeingService } from '../../../../features/wellbeing/services/wellbeing.service';
import { VitalsService } from '../../services/vitals.service';
import { PatientContextService } from '../../../../core/services/patient-context.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-monitoring-pulse',
    standalone: false,
    templateUrl: './monitoring-pulse.component.html',
    styleUrls: ['./monitoring-pulse.component.scss']
})
export class MonitoringPulseComponent implements OnInit, OnDestroy {
    status: 'stable' | 'monitor' | 'attention' | string = 'monitor';
    reportLoading = false;
    reportSent = false;
    private currentPatientId: string | null = null;
    private contextSub: Subscription | null = null;
    
    summary = [
        { label: 'Mood', value: 'N/A', icon: 'sentiment_satisfied' },
        { label: 'Sleep', value: 'N/A', icon: 'bedtime' },
        { label: 'Hydration', value: '0%', icon: 'water_drop' },
        { label: 'Cognitive', value: 'Need Data', icon: 'bolt' },
        { label: 'Vitals', value: 'Normal', icon: 'favorite' }
    ];

    recommendation = 'Monitor evening agitation. Encourage social interaction and hydration this afternoon.';

    constructor(
        private wellbeingService: WellbeingService,
        private vitalsService: VitalsService,
        private patientContext: PatientContextService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnInit() {
        this.contextSub = this.patientContext.patientId$.pipe(
            filter(id => !!id)
        ).subscribe(patientId => {
            this.currentPatientId = patientId;
            this.reportSent = false; // Reset sent state when patient changes
            this.loadPulse(patientId);
        });
    }

    ngOnDestroy() {
        this.contextSub?.unsubscribe();
    }

    private loadPulse(patientId: string) {
        this.wellbeingService.getPulse(patientId).subscribe({
            next: (pulseData) => {
                this.status = pulseData.status || 'monitor';
                
                const moodObj = this.summary.find(s => s.label === 'Mood');
                if (moodObj) moodObj.value = pulseData.moodValue;

                const sleepObj = this.summary.find(s => s.label === 'Sleep');
                if (sleepObj) sleepObj.value = pulseData.sleepValue;

                const hydrationObj = this.summary.find(s => s.label === 'Hydration');
                if (hydrationObj) hydrationObj.value = pulseData.hydrationValue;

                // Create dynamic recommendation based on status
                if (this.status === 'stable') {
                    this.recommendation = 'Patient is stable. Continue regular care routine.';
                } else if (this.status === 'attention') {
                    this.recommendation = 'Immediate attention recommended. Review sleep and hydration.';
                } else {
                    this.recommendation = 'Monitor evening agitation. Encourage social interaction and hydration.';
                }
                
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error("Failed to load patient pulse:", err);
            }
        });

        // Fetch Cognitive Games Data
        this.wellbeingService.getGameResults(patientId).subscribe({
            next: (results) => {
                const cogObj = this.summary.find(s => s.label === 'Cognitive');
                if (cogObj) {
                    if (results && results.length > 0) {
                        const avg = Math.round(results.reduce((acc, curr) => acc + curr.score, 0) / results.length);
                        cogObj.value = `${avg}% (Avg)`;
                    } else {
                        cogObj.value = 'No Data';
                    }
                    this.cdr.detectChanges();
                }
            },
            error: err => console.error("Failed to load cognitive data", err)
        });
    }

    sendDoctorReport() {
        if (!this.currentPatientId || this.status !== 'attention' || this.reportLoading || this.reportSent) return;

        this.reportLoading = true;
        this.vitalsService.sendReport(this.currentPatientId).subscribe({
            next: (msg) => {
                console.log("Report sent successfully:", msg);
                this.reportLoading = false;
                this.reportSent = true;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error("Failed to send escalation report:", err);
                this.reportLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    get statusLabel(): string {
        switch (this.status) {
            case 'stable': return '🟢 Stable';
            case 'monitor': return '🟡 Monitor';
            case 'attention': return '🔴 Attention';
            default: return '🟡 Monitor';
        }
    }
}

