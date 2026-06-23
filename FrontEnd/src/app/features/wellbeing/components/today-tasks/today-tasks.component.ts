import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { MonitoringService } from '../../../../core/services/monitoring.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MonitoringTask } from '../../../monitoring/models/monitoring.models';

@Component({
    selector: 'app-today-tasks',
    standalone: false,
    templateUrl: './today-tasks.component.html',
    styleUrls: ['./today-tasks.component.scss']
})
export class TodayTasksComponent implements OnInit {
    tasks: MonitoringTask[] = [];

    constructor(
        private monitoringService: MonitoringService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.loadTasks();
    }

    loadTasks() {
        const user = this.authService.currentUser;
        if (user) {
            this.monitoringService.getPatientTasks(user.userId.toString()).subscribe({
                next: (tasks) => {
                    const today = new Date();
                    const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;

                    this.tasks = tasks.filter(task => {
                        if (!task.createdAt) return false;
                        const d = new Date(task.createdAt);
                        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === todayStr;
                    });
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Error fetching patient tasks', err);
                    this.tasks = [
                        { id: 1, text: 'No connection yet', icon: 'error', done: false, priority: 'low', time: 'Now' }
                    ] as MonitoringTask[];
                    this.cdr.detectChanges();
                }
            });
        }
    }

    get completedCount(): number {
        return this.tasks.filter(t => t.done).length;
    }

    get progressPercent(): number {
        return Math.round((this.completedCount / this.tasks.length) * 100);
    }

    toggleTask(task: MonitoringTask) {
        task.done = !task.done;
        this.cdr.detectChanges(); // instant optimistic update

        this.monitoringService.togglePatientTask(task.id).subscribe({
            next: (updatedTask) => {
                task.done = updatedTask.done;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error toggling task', err);
                task.done = !task.done; // revert
                this.cdr.detectChanges();
            }
        });
    }
}
