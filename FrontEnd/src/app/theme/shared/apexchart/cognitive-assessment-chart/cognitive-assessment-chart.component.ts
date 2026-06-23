import { Component, Input, OnInit, OnChanges, SimpleChanges, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-cognitive-assessment-chart',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  templateUrl: './cognitive-assessment-chart.component.html',
  styleUrl: './cognitive-assessment-chart.component.scss'
})
export class CognitiveAssessmentChartComponent implements OnInit, OnChanges {
  chart = viewChild.required<ChartComponent>('chart');
  chartOptions!: Partial<ApexOptions>;

  @Input() averageMMSE: number = 0;
  @Input() averageFunctionalAssessment: number = 0;
  @Input() averageADL: number = 0;

  ngOnInit() {
    this.initializeChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.chartOptions && (changes['averageMMSE'] || changes['averageFunctionalAssessment'] || changes['averageADL'])) {
      this.updateChartData();
    }
  }

  private initializeChart() {
    this.chartOptions = {
      chart: {
        height: 350,
        type: 'radialBar',
        toolbar: { show: false },
        background: 'transparent'
      },
      plotOptions: {
        radialBar: {
          inverseOrder: false,
          hollow: {
            margin: 5,
            background: 'transparent'
          },
          track: {
            show: true,
            background: '#f0f0f0',
            strokeWidth: '97%',
            margin: 5
          },
          dataLabels: {
            show: true,
            name: {
              fontSize: '13px'
            },
            value: {
              fontSize: '14px',
              fontWeight: 600
            },
            total: {
              show: false
            }
          }
        }
      },
      colors: ['#1677ff', '#faad14', '#52c41a'],
      series: [this.getMMSEScore(), this.getFunctionalScore(), this.getADLScore()],
      labels: ['MMSE (0-30)', 'Functional (0-100)', 'ADL (0-100)']
    };
  }

  private updateChartData() {
    if (this.chartOptions) {
      this.chartOptions.series = [this.getMMSEScore(), this.getFunctionalScore(), this.getADLScore()];
      this.chartOptions = { ...this.chartOptions };
    }
  }

  private getMMSEScore(): number {
    return Math.min(100, (this.averageMMSE / 30) * 100);
  }

  private getFunctionalScore(): number {
    return Math.min(100, this.averageFunctionalAssessment);
  }

  private getADLScore(): number {
    return Math.min(100, this.averageADL);
  }

  getMMSEStatus(): string {
    if (this.averageMMSE < 18) return 'Critical';
    if (this.averageMMSE < 23) return 'At Risk';
    return 'Normal';
  }

  getMMSEStatusClass(): string {
    if (this.averageMMSE < 18) return 'status-critical';
    if (this.averageMMSE < 23) return 'status-warning';
    return 'status-normal';
  }
}
