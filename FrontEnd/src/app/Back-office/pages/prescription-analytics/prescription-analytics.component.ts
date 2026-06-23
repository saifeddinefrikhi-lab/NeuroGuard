import { Component, OnInit, ViewChild, CUSTOM_ELEMENTS_SCHEMA, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrescriptionAnalyticsService, PrescriptionAnalytics } from '../../../core/services/prescription-analytics.service';
import { ApexOptions } from 'ng-apexcharts';
import { ChartComponent, NgApexchartsModule } from 'ng-apexcharts';

@Component({
  selector: 'app-prescription-analytics',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './prescription-analytics.component.html',
  styleUrls: ['./prescription-analytics.component.scss'],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class PrescriptionAnalyticsComponent implements OnInit {
  @ViewChild('dosageChart') dosageChart!: ChartComponent;
  @ViewChild('frequencyChart') frequencyChart!: ChartComponent;
  @ViewChild('complianceChart') complianceChart!: ChartComponent;

  analytics: PrescriptionAnalytics | null = null;
  loading = true;
  error = '';

  // Chart options
  dosageChartOptions: ApexOptions = {};
  frequencyChartOptions: ApexOptions = {};
  complianceChartOptions: ApexOptions = {};

  constructor(
    private prescriptionAnalyticsService: PrescriptionAnalyticsService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAnalytics();
  }

  loadAnalytics(): void {
    this.loading = true;
    this.prescriptionAnalyticsService.getGlobalAnalytics().subscribe({
      next: (data) => {
        this.analytics = data;
        this.initializeCharts();
        setTimeout(() => {
          this.loading = false;
          this.cdr.markForCheck();
        }, 0);
      },
      error: (err) => {
        setTimeout(() => {
          this.error = 'Erreur lors du chargement des analytiques';
          this.loading = false;
          console.error(err);
          this.cdr.markForCheck();
        }, 0);
      }
    });
  }

  initializeCharts(): void {
    if (!this.analytics) return;

    // Dosage Analysis Chart
    this.dosageChartOptions = {
      chart: {
        type: 'bar',
        height: 400
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4,
          dataLabels: {
            position: 'top'
          },
          colors: {
            ranges: [
              {
                from: 0,
                to: 33,
                color: '#10B981' // LOW - Green
              },
              {
                from: 34,
                to: 66,
                color: '#F59E0B' // MEDIUM - Amber
              },
              {
                from: 67,
                to: 100,
                color: '#EF4444' // HIGH - Red
              }
            ]
          }
        }
      },
      xaxis: {
        categories: this.analytics.dosageAnalysis.map(d => d.dosage.substring(0, 20)),
        title: {
          text: 'Dosages'
        }
      },
      yaxis: {
        title: {
          text: 'Nombre de prescriptions'
        }
      },
      series: [
        {
          name: 'Prescriptions',
          data: this.analytics.dosageAnalysis.map(d => d.count)
        }
      ],
      colors: this.analytics.dosageAnalysis.map(d => this.getRiskColor(d.riskLevel)),
      tooltip: {
        y: {
          formatter: (value) => value + ' prescriptions'
        }
      }
    };

    // Frequency Analysis Chart
    this.frequencyChartOptions = {
      chart: {
        type: 'donut',
        height: 400
      },
      labels: this.analytics.frequencyAnalysis.map(f => f.frequency),
      series: this.analytics.frequencyAnalysis.map(f => f.count),
      colors: this.analytics.frequencyAnalysis.map(f => this.getComplianceColor(f.complianceRisk)),
      plotOptions: {
        pie: {
          donut: {
            size: '65%',
            labels: {
              show: true,
              name: {
                show: true,
                fontSize: '14px',
                fontFamily: 'Helvetica, Arial, sans-serif'
              },
              value: {
                show: true,
                fontSize: '16px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                formatter: (val: any) => val
              },
              total: {
                show: true,
                label: 'Total',
                fontSize: '14px',
                fontFamily: 'Helvetica, Arial, sans-serif',
                formatter: () => {
                  return this.analytics?.totalPrescriptions?.toString() || '0';
                }
              }
            }
          }
        }
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            }
          }
        }
      ]
    };

    // Compliance Risk Chart
    const complianceData = this.analytics.frequencyAnalysis.map(f => ({
      frequency: f.frequency,
      dosesPerMonth: f.totalDosesPerMonth,
      risk: f.complianceRisk
    }));

    this.complianceChartOptions = {
      chart: {
        type: 'scatter',
        height: 400
      },
      xaxis: {
        title: {
          text: 'Doses par mois'
        },
        min: 0,
        max: Math.max(...complianceData.map(c => c.dosesPerMonth)) + 10
      },
      yaxis: {
        title: {
          text: 'Risque de conformité'
        }
      },
      series: [
        {
          name: 'Fréquences',
          data: complianceData.map((c, i) => ({
            x: c.dosesPerMonth,
            y: this.getRiskScore(c.risk),
            fillColor: this.getComplianceColor(c.risk)
          }))
        }
      ],
      colors: ['#3B82F6'],
      tooltip: {
        shared: false,
        intersect: true,
        y: {
          formatter: (val: any) => {
            const riskMap = { 1: 'FAIBLE', 2: 'MOYEN', 3: 'ÉLEVÉ' };
            return riskMap[val as keyof typeof riskMap] || val;
          }
        }
      }
    };
  }

  getRiskColor(risk: string): string {
    switch (risk) {
      case 'LOW':
        return '#10B981';
      case 'MEDIUM':
        return '#F59E0B';
      case 'HIGH':
        return '#EF4444';
      default:
        return '#6B7280';
    }
  }

  getComplianceColor(risk: string): string {
    switch (risk) {
      case 'LOW':
        return '#06B6D4';
      case 'MEDIUM':
        return '#FBBF24';
      case 'HIGH':
        return '#F87171';
      default:
        return '#9CA3AF';
    }
  }

  getRiskScore(risk: string): number {
    switch (risk) {
      case 'LOW':
        return 1;
      case 'MEDIUM':
        return 2;
      case 'HIGH':
        return 3;
      default:
        return 0;
    }
  }

  getRiskBadgeClass(risk: string): string {
    switch (risk) {
      case 'LOW':
        return 'badge bg-success';
      case 'MEDIUM':
        return 'badge bg-warning text-dark';
      case 'HIGH':
        return 'badge bg-danger';
      default:
        return 'badge bg-secondary';
    }
  }
}
