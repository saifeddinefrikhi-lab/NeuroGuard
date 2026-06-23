import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { PatientContextService } from '../../../../core/services/patient-context.service';

@Component({
    selector: 'app-monitoring-dashboard',
    standalone: false,
    templateUrl: './monitoring-dashboard.component.html',
    styleUrl: './monitoring-dashboard.component.scss'
})
export class MonitoringDashboardComponent implements OnInit {

    constructor(
        private route: ActivatedRoute,
        private patientContext: PatientContextService
    ) { }

    ngOnInit() {
        this.route.params.subscribe(params => {
            if (params['id']) {
                console.log('MonitoringDashboard: setting patientId context to', params['id']);
                this.patientContext.setPatientId(params['id']);
            }
        });
    }
}
