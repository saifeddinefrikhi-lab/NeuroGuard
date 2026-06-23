import { Component, Input } from '@angular/core';
import { PatientPulseDTO } from '../../../../core/models/wellbeing.model';

@Component({
    selector: 'app-patient-pulse',
    standalone: false,
    templateUrl: './patient-pulse.component.html',
    styleUrls: ['./patient-pulse.component.scss']
})
export class PatientPulseComponent {
    @Input() set pulseData(data: PatientPulseDTO | null) {
        if (data) {
            this.status = data.status.toLowerCase() as any;
            this.summary = {
                mood: data.moodValue,
                sleep: data.sleepValue,
                hydration: data.hydrationValue,
                social: '2 interactions'
            };
        }
    }

    status: 'stable' | 'monitor' | 'attention' = 'stable';

    summary = {
        mood: '😊 Happy',
        sleep: '7.5h',
        hydration: '75%',
        social: '2 interactions'
    };

    recommendation = 'Encourage hydration and a short walk this afternoon.';

    get statusLabel(): string {
        switch (this.status) {
            case 'stable': return '🟢 Stable';
            case 'monitor': return '🟡 Monitor';
            case 'attention': return '🔴 Attention';
        }
    }

    get statusClass(): string {
        return this.status;
    }
}
