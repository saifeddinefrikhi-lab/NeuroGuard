import { Component } from '@angular/core';

@Component({
    selector: 'app-monitoring-alerts',
    standalone: false,
    templateUrl: './monitoring-alerts.component.html',
    styleUrls: ['./monitoring-alerts.component.scss']
})
export class MonitoringAlertsComponent {
    alerts = [
        { label: 'Hydration Below Target', level: 'high', icon: 'water_drop', detail: '3 consecutive days under 60%' },
        { label: 'Evening Agitation', level: 'medium', icon: 'report_problem', detail: '2 sundowning events this week' },
        { label: 'Sleep Quality', level: 'medium', icon: 'bedtime', detail: 'Below 6h on 2 nights' },
        { label: 'Cognitive Trend', level: 'low', icon: 'bolt', detail: 'Stable — no significant change' },
    ];

    getLevelColor(level: string): string {
        return level === 'high' ? '#ff5370' : level === 'medium' ? '#ffb64d' : '#2ed8b6';
    }
    getLevelBg(level: string): string {
        return level === 'high' ? 'rgba(255,83,112,0.12)' : level === 'medium' ? 'rgba(255,182,77,0.12)' : 'rgba(46,216,182,0.12)';
    }
    getLevelLabel(level: string): string {
        return level === 'high' ? 'High' : level === 'medium' ? 'Moderate' : 'Low';
    }
}
