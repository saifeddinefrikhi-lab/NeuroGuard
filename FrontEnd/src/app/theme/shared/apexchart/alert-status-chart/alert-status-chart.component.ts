import { Component, Input, OnInit, OnChanges, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-alert-status-chart',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  templateUrl: './alert-status-chart.component.html',
  styleUrl: './alert-status-chart.component.scss'
})
export class AlertStatusChartComponent implements OnInit, OnChanges {
  chart = viewChild.required<ChartComponent>('chart');
  chartOptions!: Partial<ApexOptions>;

  // Accept real data from parent component
  @Input() resolvedAlerts: number = 0;
  @Input() pendingAlerts: number = 0;

  ngOnInit() {
    this.initializeChart();
  }

  ngOnChanges() {
    if (this.chartOptions) {
      this.updateChartData();
    }
  }

  private initializeChart() {
    this.chartOptions = {
      chart: {
        height: 350,
        type: 'bar',
        toolbar: { show: false },
        background: 'transparent'
      },
      dataLabels: { enabled: false },
      colors: ['#52c41a', '#faad14'],
      series: [
        {
          name: 'Resolved',
          data: [this.resolvedAlerts, this.resolvedAlerts, this.resolvedAlerts, this.resolvedAlerts, this.resolvedAlerts, this.resolvedAlerts, this.resolvedAlerts, this.resolvedAlerts, this.resolvedAlerts, this.resolvedAlerts, this.resolvedAlerts, this.resolvedAlerts]
        },
        {
          name: 'Pending',
          data: [this.pendingAlerts, this.pendingAlerts, this.pendingAlerts, this.pendingAlerts, this.pendingAlerts, this.pendingAlerts, this.pendingAlerts, this.pendingAlerts, this.pendingAlerts, this.pendingAlerts, this.pendingAlerts, this.pendingAlerts]
        }
      ],
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
          name: 'Resolved',
          data: Array(12).fill(this.resolvedAlerts)
        },
        {
          name: 'Pending',
          data: Array(12).fill(this.pendingAlerts)
        }
      ];
      this.chartOptions = { ...this.chartOptions };
    }
  }
}

