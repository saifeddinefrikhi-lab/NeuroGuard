import { Component, Input, OnInit, OnChanges, SimpleChanges, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ChartComponent, ApexOptions } from 'ng-apexcharts';

interface HealthRiskData {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-health-risk-chart',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  templateUrl: './health-risk-chart.component.html',
  styleUrl: './health-risk-chart.component.scss'
})
export class HealthRiskChartComponent implements OnInit, OnChanges {
  chart = viewChild.required<ChartComponent>('chart');
  chartOptions!: Partial<ApexOptions>;

  @Input() geneticRiskCount: number = 0;
  @Input() smokingCount: number = 0;
  @Input() cardiovascularCount: number = 0;
  @Input() diabetesCount: number = 0;
  @Input() depressionCount: number = 0;
  @Input() comorbidityCount: number = 0;
  @Input() allergieCount: number = 0;

  ngOnInit() {
    this.initializeChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.chartOptions && (changes['geneticRiskCount'] || changes['smokingCount'] ||
        changes['cardiovascularCount'] || changes['diabetesCount'] || changes['depressionCount'] ||
        changes['comorbidityCount'] || changes['allergieCount'])) {
      this.updateChartData();
    }
  }

  private initializeChart() {
    const healthRiskData = this.getHealthRiskData();

    this.chartOptions = {
      chart: {
        type: 'bar',
        height: 350,
        toolbar: { show: false },
        background: 'transparent'
      },
      colors: healthRiskData.map(d => d.color),
      series: [
        {
          name: 'Patient Count',
          data: healthRiskData.map(d => d.value)
        }
      ],
      xaxis: {
        categories: healthRiskData.map(d => d.label),
        labels: {
          style: { colors: Array(healthRiskData.length).fill('#8c8c8c') }
        }
      },
      yaxis: {
        labels: { style: { colors: ['#8c8c8c'] } }
      },
      dataLabels: { enabled: false },
      grid: {
        strokeDashArray: 0,
        borderColor: '#f5f5f5'
      },
      plotOptions: {
        bar: {
          horizontal: true,
          columnWidth: '55%'
        }
      },
      theme: { mode: 'light' }
    };
  }

  private updateChartData() {
    const healthRiskData = this.getHealthRiskData();

    if (this.chartOptions && this.chartOptions.series) {
      this.chartOptions.series = [
        {
          name: 'Patient Count',
          data: healthRiskData.map(d => d.value)
        }
      ];
      this.chartOptions.xaxis = {
        ...this.chartOptions.xaxis,
        categories: healthRiskData.map(d => d.label)
      };
      this.chartOptions.colors = healthRiskData.map(d => d.color);
      this.chartOptions = { ...this.chartOptions };
    }
  }

  private getHealthRiskData(): HealthRiskData[] {
    return [
      { label: 'Genetic Risk', value: this.geneticRiskCount, color: '#ff4d4f' },
      { label: 'Smoking', value: this.smokingCount, color: '#ff7a45' },
      { label: 'Cardiovascular', value: this.cardiovascularCount, color: '#ffb500' },
      { label: 'Diabetes', value: this.diabetesCount, color: '#faad14' },
      { label: 'Depression', value: this.depressionCount, color: '#1890ff' },
      { label: 'Comorbidities', value: this.comorbidityCount, color: '#722ed1' },
      { label: 'Allergies', value: this.allergieCount, color: '#13c2c2' }
    ];
  }
}
