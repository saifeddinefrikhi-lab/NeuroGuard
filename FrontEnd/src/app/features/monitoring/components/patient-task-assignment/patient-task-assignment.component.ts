import { Component, ChangeDetectorRef, OnInit, OnDestroy } from '@angular/core';
import { MonitoringService } from '../../../../core/services/monitoring.service';
import { AuthService } from '../../../../core/services/auth.service';
import { PatientContextService } from '../../../../core/services/patient-context.service';
import { MonitoringTask } from '../../models/monitoring.models';
import { Subscription } from 'rxjs';

@Component({
    selector: 'app-patient-task-assignment',
    standalone: false,
    templateUrl: './patient-task-assignment.component.html',
    styleUrls: ['./patient-task-assignment.component.scss']
})
export class PatientTaskAssignmentComponent implements OnInit, OnDestroy {
    patientId = '';
    newTaskText = '';
    newTaskTime = 'Today';

    isProcessing = false;
    message = '';
    messageType: 'success' | 'error' = 'success';
    private contextSubscription: Subscription | null = null;

    constructor(
        private monitoringService: MonitoringService,
        private authService: AuthService,
        private patientContext: PatientContextService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.contextSubscription = this.patientContext.patientId$.subscribe(id => {
            this.patientId = id;
            this.cdr.detectChanges();
        });
    }

    ngOnDestroy() {
        if (this.contextSubscription) {
            this.contextSubscription.unsubscribe();
        }
    }

    assignTask() {
        if (!this.patientId.trim() || !this.newTaskText.trim()) return;

        this.isProcessing = true;
        this.message = '';

        const newTask: Partial<MonitoringTask> = {
            text: this.newTaskText,
            time: this.newTaskTime,
            icon: 'star',
            priority: 'high'
        };

        this.monitoringService.createPatientTask(this.patientId, newTask).subscribe({
            next: () => {
                this.message = 'Task assigned successfully!';
                this.messageType = 'success';
                this.newTaskText = '';
                this.newTaskTime = 'Today';
                this.isProcessing = false;
                this.cdr.detectChanges();
                setTimeout(() => this.message = '', 3000);
            },
            error: (err) => {
                console.error('Error assigning task', err);
                this.message = 'Failed to assign task.';
                this.messageType = 'error';
                this.isProcessing = false;
                this.cdr.detectChanges();
            }
        });
    }
}
