import { Component, Input, OnInit, OnChanges, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-alert-trends-chart',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  templateUrl: './alert-trends-chart.component.html',
  styleUrl: './alert-trends-chart.component.scss'
})
export class AlertTrendsChartComponent implements OnInit, OnChanges {
  chart = viewChild.required<ChartComponent>('chart');
  chartOptions!: Partial<ApexOptions>;

  // Accept real data from parent component
  @Input() criticalAlerts: number = 0;
  @Input() warningAlerts: number = 0;
  @Input() infoAlerts: number = 0;

  ngOnInit() {
    this.initializeChart();
  }

  ngOnChanges() {
    if (this.chartOptions) {
      this.updateChartData();
    }
  }

  private initializeChart() {
    // Default data - will be updated when inputs change
    this.chartOptions = {
      chart: {
        height: 350,
        type: 'area',
        toolbar: { show: false },
        background: 'transparent'
      },
      dataLabels: { enabled: false },
      colors: ['#ff4d4f', '#faad14', '#52c41a'],
      series: [
        {
          name: 'Critical Alerts',
          data: [this.criticalAlerts, this.criticalAlerts, this.criticalAlerts, this.criticalAlerts, this.criticalAlerts, this.criticalAlerts, this.criticalAlerts, this.criticalAlerts, this.criticalAlerts, this.criticalAlerts, this.criticalAlerts, this.criticalAlerts]
        },
        {
          name: 'Warning Alerts',
          data: [this.warningAlerts, this.warningAlerts, this.warningAlerts, this.warningAlerts, this.warningAlerts, this.warningAlerts, this.warningAlerts, this.warningAlerts, this.warningAlerts, this.warningAlerts, this.warningAlerts, this.warningAlerts]
        },
        {
          name: 'Info Alerts',
          data: [this.infoAlerts, this.infoAlerts, this.infoAlerts, this.infoAlerts, this.infoAlerts, this.infoAlerts, this.infoAlerts, this.infoAlerts, this.infoAlerts, this.infoAlerts, this.infoAlerts, this.infoAlerts]
        }
      ],
      stroke: {
        curve: 'smooth',
        width: 2
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        labels: {
          style: { colors: Array(12).fill('#8c8c8c') }
        },
        axisBorder: { show: true, color: '#f0f0f0' }
      },
      yaxis: {
        labels: { style: { colors: ['#8c8c8c'] } }
      },
      grid: {
        strokeDashArray: 0,
        borderColor: '#f5f5f5'
      },
      theme: { mode: 'light' }
    };
  }

  private updateChartData() {
    if (this.chartOptions && this.chartOptions.series) {
      this.chartOptions.series = [
        {
          name: 'Critical Alerts',
          data: Array(12).fill(this.criticalAlerts)
        },
        {
          name: 'Warning Alerts',
          data: Array(12).fill(this.warningAlerts)
        },
        {
          name: 'Info Alerts',
          data: Array(12).fill(this.infoAlerts)
        }
      ];
      this.chartOptions = { ...this.chartOptions };
    }
  }
}

