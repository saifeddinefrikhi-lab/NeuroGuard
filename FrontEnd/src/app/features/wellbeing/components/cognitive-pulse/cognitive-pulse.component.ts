import { Component, ViewChild } from '@angular/core';
import {
    ChartComponent,
    ApexAxisChartSeries,
    ApexChart,
    ApexXAxis,
    ApexDataLabels,
    ApexStroke,
    ApexYAxis,
    ApexTitleSubtitle,
    ApexLegend,
    ApexMarkers,
    ApexGrid
} from 'ng-apexcharts';

export type ChartOptions = {
    series: ApexAxisChartSeries;
    chart: ApexChart;
    xaxis: ApexXAxis;
    stroke: ApexStroke;
    dataLabels: ApexDataLabels;
    yaxis: ApexYAxis;
    title: ApexTitleSubtitle;
    labels: string[];
    legend: ApexLegend;
    subtitle: ApexTitleSubtitle;
    markers: ApexMarkers;
    grid: ApexGrid;
    colors: any[];
    fill: ApexFill;
    tooltip: any;
};

@Component({
    selector: 'app-cognitive-pulse',
    standalone: false,
    templateUrl: './cognitive-pulse.component.html',
    styleUrls: ['./cognitive-pulse.component.scss']
})
export class CognitivePulseComponent {
    @ViewChild('chart') chart!: ChartComponent;
    public chartOptions: Partial<ChartOptions>;

    constructor() {
        this.chartOptions = {
            series: [
                {
                    name: 'Memory Tasks',
                    data: [82, 78, 85, 80, 88, 86, 92]
                },
                {
                    name: 'Orientation',
                    data: [75, 72, 78, 70, 82, 80, 85]
                }
            ],
            chart: {
                height: 300,
                type: 'area',
                toolbar: {
                    show: false
                },
                animations: {
                    enabled: true,
                    speed: 800,
                    animateGradually: {
                        enabled: true,
                        delay: 150
                    },
                    dynamicAnimation: {
                        enabled: true,
                        speed: 350
                    }
                },
                background: 'transparent'
            },
            stroke: {
                width: 3,
                curve: 'smooth'
            },
            xaxis: {
                categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
                axisBorder: {
                    show: false
                },
                axisTicks: {
                    show: false
                }
            },
            yaxis: {
                min: 0,
                max: 100,
                labels: {
                    formatter: (val) => val + '%'
                }
            },
            grid: {
                borderColor: 'rgba(255, 255, 255, 0.1)',
                strokeDashArray: 4
            },
            markers: {
                size: 5,
                strokeWidth: 0,
                hover: {
                    size: 7
                }
            },
            legend: {
                position: 'top',
                horizontalAlign: 'right'
            },
            colors: ['#4099ff', '#2ed8b6'],
            fill: {
                type: 'gradient',
                gradient: {
                    shadeIntensity: 1,
                    opacityFrom: 0.7,
                    opacityTo: 0.9,
                    stops: [0, 90, 100]
                }
            },
            tooltip: {
                theme: 'light',
                cssClass: 'glass-tooltip'
            }
        };
    }
}
