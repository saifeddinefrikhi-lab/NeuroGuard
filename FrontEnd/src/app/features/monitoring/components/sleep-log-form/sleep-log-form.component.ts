import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../../../core/services/auth.service';
import { MonitoringService } from '../../../../core/services/monitoring.service';
import { PatientContextService } from '../../../../core/services/patient-context.service';
import { SleepService } from '../../services/sleep.service';
import { ChangeDetectorRef } from '@angular/core';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

@Component({
    selector: 'app-sleep-log-form',
    standalone: false,
    templateUrl: './sleep-log-form.component.html',
    styleUrls: ['./sleep-log-form.component.scss']
})
export class SleepLogFormComponent implements OnInit, OnDestroy {
    patientId = '';
    hours = 8;
    disturbances = 0;
    isProcessing = false;
    message = '';
    messageType: 'success' | 'error' = 'success';
    alreadyLoggedToday = false;
    private contextSubscription: Subscription | null = null;

    constructor(
        private monitoringService: MonitoringService,
        private authService: AuthService,
        private patientContext: PatientContextService,
        private sleepService: SleepService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.contextSubscription = this.patientContext.patientId$.pipe(
            filter(id => !!id)
        ).subscribe(id => {
            this.patientId = id;
            this.alreadyLoggedToday = false;
            this.message = '';
            this.checkIfAlreadyLogged(id);
            this.cdr.detectChanges();
        });
    }

    ngOnDestroy() {
        if (this.contextSubscription) {
            this.contextSubscription.unsubscribe();
        }
    }

    private checkIfAlreadyLogged(patientId: string) {
        this.sleepService.getSleepData(patientId).subscribe({
            next: (entries) => {
                const today = new Date();
                const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

                this.alreadyLoggedToday = entries.some(e => {
                    // Normalize: backend sends timestamp or date
                    const raw = (e as any).timestamp ?? e.date;
                    const d = raw ? new Date(raw) : null;
                    if (!d) return false;
                    const entryStr = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
                    return entryStr === todayStr;
                });

                this.cdr.detectChanges();
            },
            error: () => {
                // If history fetch fails, allow the form — backend 409 will still guard
                this.alreadyLoggedToday = false;
                this.cdr.detectChanges();
            }
        });
    }

    onSubmit() {
        this.isProcessing = true;
        this.message = '';

        this.monitoringService.logSleep(
            this.patientId,
            this.hours,
            'Good',
            this.disturbances
        ).subscribe({
            next: () => {
                this.message = 'Sleep logged successfully!';
                this.messageType = 'success';
                this.isProcessing = false;
                this.alreadyLoggedToday = true;
                this.sleepService.refresh$.next(); // notify chart to reload
                this.resetForm();
                this.cdr.detectChanges();
            },
            error: (err) => {
                if (err.status === 409) {
                    this.message = 'Sleep has already been logged for today.';
                    this.alreadyLoggedToday = true;
                } else {
                    this.message = 'Error logging sleep. Please try again.';
                }
                this.messageType = 'error';
                this.isProcessing = false;
                this.cdr.detectChanges();
            }
        });
    }

    private resetForm() {
        this.hours = 8;
        this.disturbances = 0;
    }
}

