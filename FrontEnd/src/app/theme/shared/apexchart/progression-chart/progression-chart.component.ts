import { Component, Input, OnInit, OnChanges, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-progression-chart',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  templateUrl: './progression-chart.component.html',
  styleUrl: './progression-chart.component.scss'
})
export class ProgressionChartComponent implements OnInit, OnChanges {
  chart = viewChild.required<ChartComponent>('chart');
  chartOptions!: Partial<ApexOptions>;

  // Accept real data from parent component
  @Input() mildCases: number = 0;
  @Input() moderateCases: number = 0;
  @Input() severeCases: number = 0;

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
        height: 300,
        type: 'donut',
        toolbar: { show: false }
      },
      colors: ['#1677ff', '#faad14', '#ff4d4f'],
      labels: ['Mild', 'Moderate', 'Severe'],
      series: [this.mildCases, this.moderateCases, this.severeCases],
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '14px',
                fontFamily: 'Noto Sans',
                color: undefined
              },
              value: {
                show: true,
                fontSize: '14px',
                fontFamily: 'Noto Sans',
                color: undefined,
                offsetY: 5
              },
              total: {
                show: true,
                label: 'Cases',
                fontSize: '14px',
                fontFamily: 'Noto Sans',
                color: '#8c8c8c'
              }
            }
          }
        }
      },
      legend: {
        position: 'bottom'
      }
    };
  }

  private updateChartData() {
    if (this.chartOptions) {
      this.chartOptions.series = [this.mildCases, this.moderateCases, this.severeCases];
      this.chartOptions = { ...this.chartOptions };
    }
  }
}

