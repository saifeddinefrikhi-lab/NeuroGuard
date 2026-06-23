import { Component } from '@angular/core';

@Component({
    selector: 'app-social-pulse',
    standalone: false,
    templateUrl: './social-pulse.component.html',
    styleUrls: ['./social-pulse.component.scss']
})
export class SocialPulseComponent {
    interactions = [
        { type: 'Family Call', time: '2h ago', icon: 'phone' },
        { type: 'Nurse Visit', time: '4h ago', icon: 'person_check' }
    ];
}
