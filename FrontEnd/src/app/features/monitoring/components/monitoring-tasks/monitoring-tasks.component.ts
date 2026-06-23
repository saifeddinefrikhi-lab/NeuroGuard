import { Component, OnInit } from '@angular/core';
import { MonitoringService } from '../../../../core/services/monitoring.service';
import { AuthService } from '../../../../core/services/auth.service';
import { MonitoringTask } from '../../models/monitoring.models';

@Component({
    selector: 'app-monitoring-tasks',
    standalone: false,
    templateUrl: './monitoring-tasks.component.html',
    styleUrls: ['./monitoring-tasks.component.scss']
})
export class MonitoringTasksComponent implements OnInit {
    tasks: MonitoringTask[] = [];

    // Fields for new task input
    newTaskText = '';
    newTaskPriority: 'low' | 'medium' | 'high' = 'low';
    newTaskTime = 'Today';

    isProcessing = false;

    constructor(
        private monitoringService: MonitoringService,
        private authService: AuthService
    ) { }

    ngOnInit() {
        this.loadTasks();
    }

    loadTasks() {
        const user = this.authService.currentUser;
        if (user) {
            this.monitoringService.getCaregiverTasks(user.userId.toString()).subscribe({
                next: (tasks) => this.tasks = tasks,
                error: (err) => {
                    console.error('Error fetching caregiver tasks', err);
                    // Fallback purely for design demo if backend is offline
                    this.tasks = [
                        { id: 1, text: 'No connection yet', icon: 'error', done: false, priority: 'high', time: 'Now' }
                    ] as MonitoringTask[];
                }
            });
        }
    }

    get completedCount(): number { return this.tasks.filter(t => t.done).length; }
    get progressPercent(): number { return this.tasks.length === 0 ? 0 : Math.round((this.completedCount / this.tasks.length) * 100); }

    toggleTask(task: MonitoringTask) {
        task.done = !task.done;
        this.monitoringService.toggleCaregiverTask(task.id).subscribe({
            next: (updated) => task.done = updated.done,
            error: (err) => {
                console.error('Failed to toggle', err);
                task.done = !task.done;
            }
        });
    }

    addTask() {
        if (!this.newTaskText.trim()) return;
        const user = this.authService.currentUser;
        if (!user) return;

        this.isProcessing = true;
        const newTask: Partial<MonitoringTask> = {
            text: this.newTaskText,
            priority: this.newTaskPriority,
            time: this.newTaskTime,
            icon: 'assignment' // Default icon for manual tasks
        };

        this.monitoringService.createCaregiverTask(user.userId.toString(), newTask).subscribe({
            next: (created) => {
                this.tasks.push(created);
                this.newTaskText = '';
                this.newTaskPriority = 'low';
                this.newTaskTime = 'Today';
                this.isProcessing = false;
            },
            error: (err) => {
                console.error('Error creating task', err);
                this.isProcessing = false;
            }
        });
    }

    deleteTask(task: MonitoringTask, event: Event) {
        event.stopPropagation(); // prevent toggle
        this.monitoringService.deleteCaregiverTask(task.id).subscribe({
            next: () => {
                this.tasks = this.tasks.filter(t => t.id !== task.id);
            },
            error: (err) => console.error('Error deleting task', err)
        });
    }

    getPriorityColor(p: string): string {
        return p === 'high' ? '#ff5370' : p === 'medium' ? '#ffb64d' : '#2ed8b6';
    }
}
