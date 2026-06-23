import { Component } from '@angular/core';

@Component({
    selector: 'app-risk-indicator',
    standalone: false,
    templateUrl: './risk-indicator.component.html',
    styleUrls: ['./risk-indicator.component.scss']
})
export class RiskIndicatorComponent {
    risks = [
        { label: 'Mood Drop', level: 'low', icon: 'trending_down', detail: 'Stable this week' },
        { label: 'Sleep Quality', level: 'medium', icon: 'bedtime', detail: '2 nights below 6h' },
        { label: 'Low Hydration', level: 'high', icon: 'water_drop', detail: '3 days under target' },
        { label: 'Social Isolation', level: 'low', icon: 'groups', detail: '4 interactions this week' }
    ];

    getLevelColor(level: string): string {
        switch (level) {
            case 'high': return '#ff5370';
            case 'medium': return '#ffb64d';
            default: return '#2ed8b6';
        }
    }

    getLevelBg(level: string): string {
        switch (level) {
            case 'high': return 'rgba(255, 83, 112, 0.12)';
            case 'medium': return 'rgba(255, 182, 77, 0.12)';
            default: return 'rgba(46, 216, 182, 0.12)';
        }
    }

    getLevelLabel(level: string): string {
        switch (level) {
            case 'high': return 'High';
            case 'medium': return 'Moderate';
            default: return 'Low';
        }
    }
}
