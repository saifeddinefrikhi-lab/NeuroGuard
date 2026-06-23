import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { StatisticsService, PatientStatisticsDTO } from 'src/app/core/services/statistics.service';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { RiseOutline, FallOutline } from '@ant-design/icons-angular/icons';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';

interface ChartPoint {
  label: string;
  value: number;
  percent: number;
  colorClass: string;
}

/**
 * Refactored Patient Home Component
 * Uses backend statistics service instead of client-side aggregation
 * Single API call to get all statistics with table joins on backend
 */
@Component({
  selector: 'app-home',
  imports: [CommonModule, CardComponent, IconDirective],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  private iconService = inject(IconService);
  private statisticsService = inject(StatisticsService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    this.iconService.addIcon(...[RiseOutline, FallOutline]);
  }

  loadingStats = true;

  AnalyticEcommerce = [
    { title: 'Medical History Status', amount: 'Unknown', background: 'bg-light-primary', border: 'border-primary', icon: 'rise', percentage: '0%', color: 'text-primary', number: 'Profile completeness', note: 'Availability of personal medical history' },
    { title: 'Recorded Surgeries', amount: '0', background: 'bg-light-success', border: 'border-success', icon: 'rise', percentage: '0%', color: 'text-success', number: 'Surgical events', note: 'Total surgeries in history' },
    { title: 'Pending Alerts', amount: '0', background: 'bg-light-warning', border: 'border-warning', icon: 'fall', percentage: '0%', color: 'text-warning', number: 'Unresolved notifications', note: 'Alerts requiring your attention' },
    { title: 'Critical Risk Alerts', amount: '0', background: 'bg-light-danger', border: 'border-danger', icon: 'fall', percentage: '0%', color: 'text-danger', number: 'Critical unresolved alerts', note: 'Highest urgency risks' }
  ];

  severityChart: ChartPoint[] = [];
  statusChart: ChartPoint[] = [];
  riskFactorChart: ChartPoint[] = [];
  latestRiskAlerts: any[] = [];

  ngOnInit(): void {
    setTimeout(() => this.loadStatistics());
  }

  /**
   * Load statistics from backend (single API call)
   * Backend aggregates all data via table joins
   */
  private loadStatistics(): void {
    this.loadingStats = true;

    // Single API call to get all statistics
    this.statisticsService.getMyPatientStatistics()
      .pipe(
        catchError(error => {
          console.error('Failed to load statistics:', error);
          this.loadingStats = false;
          this.cdr.detectChanges();
          return of(null);
        })
      )
      .subscribe(statistics => {
        if (statistics) {
          setTimeout(() => {
            this.updatePatientStats(statistics);
            this.loadingStats = false;
            this.cdr.detectChanges();
          });
        }
      });
  }

  /**
   * Update UI with statistics from backend
   * All calculations and joins were done on backend
   */
  private updatePatientStats(stats: PatientStatisticsDTO): void {
    this.AnalyticEcommerce = [
      {
        title: 'Medical History Status',
        amount: stats.hasMedicalHistory ? 'Available' : 'Missing',
        background: 'bg-light-primary',
        border: 'border-primary',
        icon: 'rise',
        percentage: stats.hasMedicalHistory ? '100%' : '0%',
        color: 'text-primary',
        number: stats.hasMedicalHistory ? 'Profile complete' : 'No record yet',
        note: 'Availability of personal medical history'
      },
      {
        title: 'Recorded Surgeries',
        amount: String(stats.totalSurgeries),
        background: 'bg-light-success',
        border: 'border-success',
        icon: 'rise',
        percentage: stats.hasMedicalHistory ? '100%' : '0%',
        color: 'text-success',
        number: 'Surgical events',
        note: 'Total surgeries in history'
      },
      {
        title: 'Pending Alerts',
        amount: String(stats.pendingAlerts),
        background: 'bg-light-warning',
        border: 'border-warning',
        icon: 'fall',
        percentage: `${this.calculatePercent(stats.pendingAlerts, stats.totalAlerts)}%`,
        color: 'text-warning',
        number: 'Unresolved notifications',
        note: 'Alerts requiring your attention'
      },
      {
        title: 'Critical Risk Alerts',
        amount: String(stats.criticalAlerts),
        background: 'bg-light-danger',
        border: 'border-danger',
        icon: 'fall',
        percentage: `${this.calculatePercent(stats.criticalAlerts, stats.totalAlerts)}%`,
        color: 'text-danger',
        number: 'Critical unresolved alerts',
        note: 'Highest urgency risks'
      }
    ];

    // Build severity chart
    this.severityChart = this.buildChart([
      { label: 'Critical', value: stats.criticalAlerts, colorClass: 'bg-danger' },
      { label: 'Warning', value: stats.warningAlerts, colorClass: 'bg-warning' },
      { label: 'Info', value: stats.infoAlerts, colorClass: 'bg-info' }
    ]);

    // Build status chart
    this.statusChart = this.buildChart([
      { label: 'Pending', value: stats.pendingAlerts, colorClass: 'bg-warning' },
      { label: 'Resolved', value: stats.resolvedAlerts, colorClass: 'bg-success' }
    ]);

    // Build risk factor chart
    this.riskFactorChart = this.buildChart([
      { label: 'Comorbidities', value: stats.comorbiditiesCount, colorClass: 'bg-primary' },
      { label: 'Medication Allergies', value: stats.medicationAllergiesCount, colorClass: 'bg-info' },
      { label: 'Food Allergies', value: stats.foodAllergiesCount, colorClass: 'bg-warning' },
      { label: 'Environmental Allergies', value: stats.environmentalAllergiesCount, colorClass: 'bg-danger' }
    ]);
  }

  private buildChart(series: Array<{ label: string; value: number; colorClass: string }>): ChartPoint[] {
    const maxValue = Math.max(1, ...series.map(item => item.value));
    return series.map(item => ({
      ...item,
      percent: Math.round((item.value / maxValue) * 100)
    }));
  }

  private calculatePercent(value: number, total: number): number {
    return total > 0 ? Math.round((value / total) * 100) : 0;
  }
}
