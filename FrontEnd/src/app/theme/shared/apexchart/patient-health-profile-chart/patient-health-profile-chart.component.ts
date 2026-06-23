import { Component, Input, OnInit, OnChanges, SimpleChanges, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-patient-health-profile-chart',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  templateUrl: './patient-health-profile-chart.component.html',
  styleUrl: './patient-health-profile-chart.component.scss'
})
export class PatientHealthProfileChartComponent implements OnInit, OnChanges {
  chart = viewChild.required<ChartComponent>('chart');
  chartOptions!: Partial<ApexOptions>;

  @Input() mildCases: number = 0;
  @Input() moderateCases: number = 0;
  @Input() severeCases: number = 0;
  @Input() comorbiditiesCount: number = 0;
  @Input() allergiesCount: number = 0;

  ngOnInit() {
    this.initializeChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.chartOptions && (changes['mildCases'] || changes['moderateCases'] ||
        changes['severeCases'] || changes['comorbiditiesCount'] || changes['allergiesCount'])) {
      this.updateChartData();
    }
  }

  private initializeChart() {
    this.chartOptions = {
      chart: {
        type: 'bar',
        height: 300,
        stacked: true,
        toolbar: { show: false },
        background: 'transparent'
      },
      colors: ['#1677ff', '#faad14', '#ff4d4f'],
      plotOptions: {
        bar: {
          horizontal: true,
          columnWidth: '55%'
        }
      },
      dataLabels: { enabled: false },
      xaxis: {
        categories: ['Progression Status', 'Health Risks'],
        labels: { style: { colors: ['#8c8c8c', '#8c8c8c'] } }
      },
      yaxis: {
        labels: { style: { colors: ['#8c8c8c'] } }
      },
      series: [
        {
          name: 'Mild',
          data: [this.mildCases, Math.round(this.comorbiditiesCount / 2)]
        },
        {
          name: 'Moderate',
          data: [this.moderateCases, Math.round(this.comorbiditiesCount / 2)]
        },
        {
          name: 'Severe',
          data: [this.severeCases, this.allergiesCount]
        }
      ],
      grid: {
        strokeDashArray: 0,
        borderColor: '#f5f5f5'
      },
      legend: {
        position: 'bottom'
      },
      theme: { mode: 'light' }
    };
  }

  private updateChartData() {
    if (this.chartOptions && this.chartOptions.series) {
      this.chartOptions.series = [
        {
          name: 'Mild',
          data: [this.mildCases, Math.round(this.comorbiditiesCount / 2)]
        },
        {
          name: 'Moderate',
          data: [this.moderateCases, Math.round(this.comorbiditiesCount / 2)]
        },
        {
          name: 'Severe',
          data: [this.severeCases, this.allergiesCount]
        }
      ];
      this.chartOptions = { ...this.chartOptions };
    }
  }
}
