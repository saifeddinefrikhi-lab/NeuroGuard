import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { WellbeingService } from '../../../../core/services/wellbeing.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
    ChartComponent,
    ApexAxisChartSeries,
    ApexChart,
    ApexXAxis,
    ApexStroke,
    ApexDataLabels,
    ApexYAxis,
    ApexGrid,
    ApexLegend,
    ApexMarkers,
    ApexFill
} from 'ng-apexcharts';

export type TrendChartOptions = {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    stroke: ApexStroke;
    dataLabels: ApexDataLabels;
    yaxis: ApexYAxis;
    grid: ApexGrid;
    legend: ApexLegend;
    markers: ApexMarkers;
    colors: string[];
    fill: ApexFill;
    tooltip: any;
};

@Component({
    selector: 'app-mood-trend',
    standalone: false,
    templateUrl: './mood-trend.component.html',
    styleUrls: ['./mood-trend.component.scss']
})
export class MoodTrendComponent implements OnInit {
    @ViewChild('chart') chart!: ChartComponent;
    public chartOptions: Partial<TrendChartOptions>;
    activePeriod = '7d';

    private moodScores: { [key: string]: number } = {
        'Happy': 5,
        'Neutral': 3,
        'Agitated': 2,
        'Sad': 1,
        'Tired': 1
    };

    constructor(
        private wellbeingService: WellbeingService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) {
        this.chartOptions = {
            series: [
                {
                    name: 'Mood Score',
                    data: [0, 0, 0, 0, 0, 0, 0]
                },
                {
                    name: 'Clarity Score',
                    data: [0, 0, 0, 0, 0, 0, 0]
                }
            ],
            chart: {
                height: 280,
                type: 'line',
                toolbar: { show: false },
                background: 'transparent',
                animations: {
                    enabled: true,
                    speed: 800,
                    dynamicAnimation: { enabled: true, speed: 350 }
                }
            },
            stroke: {
                width: [3, 2],
                curve: 'smooth',
                dashArray: [0, 5]
            },
            colors: ['#4099ff', '#2ed8b6'],
            xaxis: {
                categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: {
                    style: { fontSize: '12px', fontWeight: 600, colors: '#999' }
                }
            },
            yaxis: {
                min: 0,
                max: 5,
                tickAmount: 5,
                labels: {
                    formatter: (val: number) => val.toFixed(0),
                    style: { fontSize: '12px', colors: '#999' }
                }
            },
            grid: {
                borderColor: 'rgba(0, 0, 0, 0.06)',
                strokeDashArray: 4
            },
            markers: {
                size: [5, 4],
                strokeWidth: 0,
                hover: { size: 7 }
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right',
                fontSize: '13px',
                fontWeight: 600
            },
            dataLabels: { enabled: false },
            tooltip: { theme: 'light', cssClass: 'glass-tooltip' }
        };
    }

    ngOnInit() {
        this.loadMoodTrends();
    }

    loadMoodTrends() {
        const user = this.authService.currentUser;
        if (user) {
            this.wellbeingService.getMoodTrends(user.userId.toString()).subscribe({
                next: (trends) => {
                    if (trends && trends.length > 0) {
                        const reversedTrends = [...trends].reverse();
                        const scores = reversedTrends.map(m => this.moodScores[m.moodLabel] || 3);
                        const labels = reversedTrends.map(m => new Date(m.timestamp!).toLocaleDateString(undefined, { weekday: 'short' }));

                        this.chartOptions.series = [
                            {
                                name: 'Mood Score',
                                data: scores
                            },
                            {
                                name: 'Clarity Score',
                                data: Array(scores.length).fill(4)
                            }
                        ];
                        this.chartOptions.xaxis = {
                            ...this.chartOptions.xaxis,
                            categories: labels
                        };
                        this.cdr.detectChanges();
                    }
                },
                error: (err) => console.error('Error fetching mood trends', err)
            });
        }
    }

    setPeriod(period: string) {
        this.activePeriod = period;
    }
}
