import { Component } from '@angular/core';

@Component({
    selector: 'app-daily-goals',
    standalone: false,
    templateUrl: './daily-goals.component.html',
    styleUrls: ['./daily-goals.component.scss']
})
export class DailyGoalsComponent {
    goals = [
        { id: 1, text: 'Morning Orientation', done: true, icon: 'ti ti-compass' },
        { id: 2, text: 'Physical Exercise', done: false, icon: 'ti ti-activity' },
        { id: 3, text: 'Call a Family Member', done: false, icon: 'ti ti-phone' }
    ];

    toggleGoal(goal: any) {
        goal.done = !goal.done;
    }
}
