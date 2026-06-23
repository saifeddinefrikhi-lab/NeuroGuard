import { Component, OnInit } from '@angular/core';
import { BehaviorService } from '../../services/behavior.service';
import { BehaviorEntry } from '../../models/monitoring.models';

@Component({
    selector: 'app-behavior-logs',
    standalone: false,
    templateUrl: './behavior-logs.component.html',
    styleUrls: ['./behavior-logs.component.scss']
})
export class BehaviorLogsComponent implements OnInit {
    logs: BehaviorEntry[] = [];
    loading = true;

    constructor(private behaviorService: BehaviorService) { }

    ngOnInit() {
        this.behaviorService.getBehaviorLogs('patient-1').subscribe(data => {
            this.logs = data;
            this.loading = false;
        });
    }

    getSeverityClass(severity: string): string {
        switch (severity) {
            case 'Severe': return 'poor';
            case 'Moderate': return 'moderate';
            default: return 'good';
        }
    }

    getTypeIcon(type: string): string {
        switch (type) {
            case 'Agitation': return 'warning';
            case 'Wandering': return 'near_me';
            case 'Confusion': return 'help_outline';
            case 'Aggression': return 'report_problem';
            case 'Sundowning': return 'nights_stay';
            default: return 'info';
        }
    }

    formatDate(date: Date): string {
        return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
}
