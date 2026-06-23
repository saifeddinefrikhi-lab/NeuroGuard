// angular import
import { Component, OnInit, Input, viewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

// project import

// third party
import { ChartComponent, ApexOptions } from 'ng-apexcharts';

@Component({
  selector: 'app-monthly-bar-chart',
  standalone: true,
  imports: [CommonModule, ChartComponent],
  templateUrl: './monthly-bar-chart.component.html',
  styleUrl: './monthly-bar-chart.component.scss'
})
export class MonthlyBarChartComponent implements OnInit, OnChanges {
  // public props
  chart = viewChild.required<ChartComponent>('chart');
  chartOptions!: Partial<ApexOptions>;

  // Input properties
  @Input() chartData: number[] = [];
  @Input() chartCategories: string[] = [];
  @Input() seriesName: string = 'Series';

  // life cycle hook
  ngOnInit() {
    document.querySelector('.chart-income.week')?.classList.add('active');
    this.initializeChart();
  }

  ngOnChanges(changes: SimpleChanges) {
    if ((changes['chartData'] || changes['chartCategories']) && this.chartOptions) {
      this.updateChartData();
    }
  }

  private initializeChart() {
    this.chartOptions = {
      chart: {
        height: 450,
        type: 'area',
        toolbar: {
          show: false
        },
        background: 'transparent'
      },
      dataLabels: {
        enabled: false
      },
      colors: ['#1677ff', '#0050b3'],
      series: [
        {
          name: this.seriesName || 'Series',
          data: this.chartData && this.chartData.length > 0 ? this.chartData : [0, 86, 28, 115, 48, 210, 136]
        }
      ],
      stroke: {
        curve: 'smooth',
        width: 2
      },
      xaxis: {
        categories: this.chartCategories && this.chartCategories.length > 0 ? this.chartCategories : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        labels: {
          style: {
            colors: [
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c',
              '#8c8c8c'
            ]
          }
        },
        axisBorder: {
          show: true,
          color: '#f0f0f0'
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: ['#8c8c8c']
          }
        }
      },
      grid: {
        strokeDashArray: 0,
        borderColor: '#f5f5f5'
      },
      theme: {
        mode: 'light'
      }
    };
  }

  private updateChartData() {
    const series = [
      {
        name: this.seriesName || 'Series',
        data: this.chartData || [0, 86, 28, 115, 48, 210, 136]
      }
    ];
    const xaxis = { ...this.chartOptions.xaxis };
    xaxis.categories = this.chartCategories && this.chartCategories.length > 0 ? this.chartCategories : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    this.chartOptions = { ...this.chartOptions, series, xaxis };
  }

  // public method
  toggleActive(value: string) {
    this.chartOptions.series = [
      {
        name: 'Page Views',
        data: value === 'month' ? [76, 85, 101, 98, 87, 105, 91, 114, 94, 86, 115, 35] : [31, 40, 28, 51, 42, 109, 100]
      },
      {
        name: 'Sessions',
        data: value === 'month' ? [110, 60, 150, 35, 60, 36, 26, 45, 65, 52, 53, 41] : [11, 32, 45, 32, 34, 52, 41]
      }
    ];
    const xaxis = { ...this.chartOptions.xaxis };
    xaxis.categories =
      value === 'month'
        ? ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        : ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    xaxis.tickAmount = value === 'month' ? 11 : 7;
    this.chartOptions = { ...this.chartOptions, xaxis };
    if (value === 'month') {
      document.querySelector('.chart-income.month')?.classList.add('active');
      document.querySelector('.chart-income.week')?.classList.remove('active');
    } else {
      document.querySelector('.chart-income.week')?.classList.add('active');
      document.querySelector('.chart-income.month')?.classList.remove('active');
    }
  }
}
