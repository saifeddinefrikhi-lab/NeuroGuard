import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { MonitoringService } from '../../../../core/services/monitoring.service';
import { AuthService } from '../../../../core/services/auth.service';
import {
    ChartComponent,
    ApexNonAxisChartSeries,
    ApexPlotOptions,
    ApexChart,
    ApexFill,
    ApexStroke
} from 'ng-apexcharts';

export type ChartOptions = {
    series: ApexNonAxisChartSeries;
    chart: ApexChart;
    labels: string[];
    plotOptions: ApexPlotOptions;
    fill: ApexFill;
    stroke: ApexStroke;
};

@Component({
    selector: 'app-sleep-monitor',
    standalone: false,
    templateUrl: './sleep-monitor.component.html',
    styleUrls: ['./sleep-monitor.component.scss']
})
export class SleepMonitorComponent implements OnInit {
    @ViewChild('chart') chart!: ChartComponent;
    public chartOptions: Partial<ChartOptions>;
    sleepDuration: number = 0;
    sleepQuality: string = 'N/A';

    constructor(
        private monitoringService: MonitoringService,
        private authService: AuthService,
        private cdr: ChangeDetectorRef
    ) {
        this.chartOptions = {
            series: [0],
            chart: {
                height: 350,
                type: 'radialBar',
                toolbar: {
                    show: false
                }
            },
            plotOptions: {
                radialBar: {
                    startAngle: -135,
                    endAngle: 225,
                    hollow: {
                        margin: 0,
                        size: '70%',
                        background: 'transparent',
                        image: undefined,
                        position: 'front'
                    },
                    track: {
                        background: 'rgba(255, 255, 255, 0.1)',
                        strokeWidth: '67%',
                        margin: 0
                    },
                    dataLabels: {
                        show: true,
                        name: {
                            offsetY: -10,
                            show: true,
                            color: '#888',
                            fontSize: '17px'
                        },
                        value: {
                            formatter: function (val: any) {
                                return parseInt(val.toString()) + '%';
                            },
                            color: '#111',
                            fontSize: '36px',
                            show: true
                        }
                    }
                }
            },
            fill: {
                type: 'gradient',
                gradient: {
                    shade: 'dark',
                    type: 'horizontal',
                    shadeIntensity: 0.5,
                    gradientToColors: ['#ABE5A1'],
                    inverseColors: true,
                    opacityFrom: 1,
                    opacityTo: 1,
                    stops: [0, 100]
                }
            },
            stroke: {
                lineCap: 'round'
            },
            labels: ['Sleep Quality']
        };
    }

    ngOnInit() {
        this.loadSleepData();
    }

    loadSleepData() {
        const user = this.authService.currentUser;
        if (user) {
            this.monitoringService.getLatestSleep(user.userId.toString()).subscribe({
                next: (latestSleep) => {
                    if (latestSleep) {
                        const duration = (latestSleep as any).duration || latestSleep.hours || 0;
                        const quality = latestSleep.quality || 'Good';

                        this.sleepDuration = duration;
                        this.sleepQuality = quality;

                        const percentage = Math.min((duration / 8) * 100, 100);
                        this.chartOptions.series = [Math.round(percentage)];

                        // dynamic color based on quality
                        let color = '#ABE5A1'; // Good
                        if (quality.toLowerCase() === 'moderate') {
                            color = '#FFB64D';
                        } else if (quality.toLowerCase() === 'poor') {
                            color = '#FF5370';
                        }

                        this.chartOptions.fill = {
                            type: 'gradient',
                            gradient: {
                                shade: 'dark',
                                type: 'horizontal',
                                shadeIntensity: 0.5,
                                gradientToColors: [color],
                                inverseColors: true,
                                opacityFrom: 1,
                                opacityTo: 1,
                                stops: [0, 100]
                            }
                        };

                        this.cdr.detectChanges();
                    }
                },
                error: (err) => console.error('Error fetching latest sleep data', err)
            });
        }
    }
}
