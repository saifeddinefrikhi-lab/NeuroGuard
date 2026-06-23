import { Component, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { SleepService } from '../../services/sleep.service';
import { SleepEntry } from '../../models/monitoring.models';
import { PatientContextService } from '../../../../core/services/patient-context.service';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import {
    ChartComponent,
    ApexAxisChartSeries,
    ApexChart,
    ApexXAxis,
    ApexYAxis,
    ApexDataLabels,
    ApexPlotOptions,
    ApexGrid
} from 'ng-apexcharts';

@Component({
    selector: 'app-sleep-activity-trends',
    standalone: false,
    templateUrl: './sleep-activity-trends.component.html',
    styleUrls: ['./sleep-activity-trends.component.scss']
})
export class SleepActivityTrendsComponent implements OnInit, OnDestroy {
    @ViewChild('chart') chart!: ChartComponent;
    public chartOptions: any;
    loading = true;
    weeklyAvg = 0;
    avgDisturbances = 0;
    private contextSubscription: Subscription | null = null;
    private refreshSubscription: Subscription | null = null;
    private currentPatientId = '';

    constructor(
        private sleepService: SleepService,
        private patientContext: PatientContextService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit() {
        this.contextSubscription = this.patientContext.patientId$.pipe(
            filter(id => !!id)
        ).subscribe(patientId => {
            this.currentPatientId = patientId;
            this.loadSleepData(patientId);
        });

        // Reload chart whenever a new sleep entry is saved
        this.refreshSubscription = this.sleepService.refresh$.subscribe(() => {
            if (this.currentPatientId) {
                this.loadSleepData(this.currentPatientId);
            }
        });
    }

    ngOnDestroy() {
        this.contextSubscription?.unsubscribe();
        this.refreshSubscription?.unsubscribe();
    }

    private loadSleepData(patientId: string) {
        this.loading = true;
        this.sleepService.getSleepData(patientId).subscribe({
            next: (data) => {
                // BUG FIX: Map 'duration' from backend to 'hours' for frontend model
                const normalizedData = data.map(entry => ({
                    ...entry,
                    hours: (entry as any).duration !== undefined ? (entry as any).duration : (entry as any).hours,
                    date: (entry as any).timestamp ? new Date((entry as any).timestamp) : entry.date
                }));

                // Filter out future-dated entries (only show today and past days)
                const today = new Date();
                today.setHours(23, 59, 59, 999); // include the full current day
                const pastData = normalizedData
                    .filter(e => {
                        const entryDate = e.date instanceof Date ? e.date : new Date(e.date);
                        return entryDate <= today;
                    })
                    // Sort ascending so chart reads oldest → newest (left → right)
                    .sort((a, b) => {
                        const da = a.date instanceof Date ? a.date : new Date(a.date);
                        const db = b.date instanceof Date ? b.date : new Date(b.date);
                        return da.getTime() - db.getTime();
                    });

                if (pastData.length > 0) {
                    this.weeklyAvg = +(pastData.reduce((s, e) => s + e.hours, 0) / pastData.length).toFixed(1);
                    this.avgDisturbances = +(pastData.reduce((s, e) => s + e.disturbances, 0) / pastData.length).toFixed(1);
                    this.buildChart(pastData);
                }
                this.loading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error fetching sleep data', err);
                this.loading = false;
                this.cdr.detectChanges();
            }
        });
    }

    private buildChart(data: SleepEntry[]) {
        const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        // Build X-axis labels from the actual entry dates so they always match the data points
        const days = data.map(entry => {
            const d = entry.date instanceof Date ? entry.date : new Date(entry.date);
            return `${DAY_NAMES[d.getDay()]} ${d.getDate()}`;
        });
        this.chartOptions = {
            series: [
                { name: 'Sleep Hours', type: 'bar', data: data.map(d => d.hours) },
                { name: 'Disturbances', type: 'line', data: data.map(d => d.disturbances) }
            ],
            chart: {
                height: 280,
                type: 'line',
                toolbar: { show: false },
                background: 'transparent',
                animations: { enabled: true, speed: 800 }
            },
            plotOptions: {
                bar: { borderRadius: 8, columnWidth: '50%' }
            },
            colors: ['#6c5ce7', '#ff5370'],
            stroke: { width: [0, 3], curve: 'smooth' },
            xaxis: {
                categories: days,
                axisBorder: { show: false },
                axisTicks: { show: false }
            },
            yaxis: [
                { title: { text: 'Hours' }, min: 0, max: 10 },
                { opposite: true, title: { text: 'Disturbances' }, min: 0, max: 5 }
            ],
            grid: { borderColor: 'rgba(0,0,0,0.06)', strokeDashArray: 4 },
            dataLabels: { enabled: false },
            legend: { position: 'top', horizontalAlign: 'right' },
            tooltip: { theme: 'light' }
        };
    }

    getQualityBadge(): string {
        if (this.weeklyAvg >= 7) return 'Good';
        if (this.weeklyAvg >= 6) return 'Moderate';
        return 'Poor';
    }

    getQualityClass(): string {
        if (this.weeklyAvg >= 7) return 'good';
        if (this.weeklyAvg >= 6) return 'moderate';
        return 'poor';
    }
}
