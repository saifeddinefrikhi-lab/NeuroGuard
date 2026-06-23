import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { StatisticsService, CaregiverStatisticsDTO } from 'src/app/core/services/statistics.service';
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
 * Refactored Caregiver Home Component
 * Uses backend statistics service instead of client-side aggregation
 * Single API call to get aggregated statistics with table joins
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
    { title: 'Assigned Patients', amount: '0', background: 'bg-light-primary', border: 'border-primary', icon: 'rise', percentage: '0%', color: 'text-primary', number: 'Under follow-up', note: 'Patients assigned to caregiver' },
    { title: 'Medical Histories Available', amount: '0', background: 'bg-light-success', border: 'border-success', icon: 'rise', percentage: '0%', color: 'text-success', number: 'Records accessible', note: 'Medical histories currently visible' },
    { title: 'Pending Risk Alerts', amount: '0', background: 'bg-light-warning', border: 'border-warning', icon: 'fall', percentage: '0%', color: 'text-warning', number: 'Unresolved alerts', note: 'Alerts requiring caregiver action' },
    { title: 'Critical Risk Alerts', amount: '0', background: 'bg-light-danger', border: 'border-danger', icon: 'fall', percentage: '0%', color: 'text-danger', number: 'Critical unresolved alerts', note: 'Highest urgency patient risks' }
  ];

  severityChart: ChartPoint[] = [];
  statusChart: ChartPoint[] = [];
  progressionChart: ChartPoint[] = [];
  latestRiskAlerts: any[] = [];

  ngOnInit(): void {
    setTimeout(() => this.loadStatistics());
  }

  /**
   * Load statistics from backend (single API call)
   * Backend aggregates all data including assigned patients and their alerts
   */
  private loadStatistics(): void {
    this.loadingStats = true;

    // Single API call to get all caregiver statistics
    this.statisticsService.getMyCaregiverStatistics()
      .pipe(
        catchError(error => {
          console.error('Failed to load caregiver statistics:', error);
          this.loadingStats = false;
          this.cdr.detectChanges();
          return of(null);
        })
      )
      .subscribe(statistics => {
        if (statistics) {
          setTimeout(() => {
            this.updateCaregiverStats(statistics);
            this.loadingStats = false;
            this.cdr.detectChanges();
          });
        }
      });
  }

  /**
   * Update UI with statistics from backend
   * All aggregations and joins were performed on backend
   */
  private updateCaregiverStats(stats: CaregiverStatisticsDTO): void {
    const historyCoverage = Math.round(stats.historyCoverage);
    const pendingRate = this.calculatePercent(stats.pendingAlerts, stats.totalAlerts);
    const criticalRate = this.calculatePercent(stats.criticalAlerts, stats.totalAlerts);

    this.AnalyticEcommerce = [
      {
        title: 'Assigned Patients',
        amount: String(stats.totalAssignedPatients),
        background: 'bg-light-primary',
        border: 'border-primary',
        icon: 'rise',
        percentage: '100%',
        color: 'text-primary',
        number: 'Under follow-up',
        note: 'Patients assigned to caregiver'
      },
      {
        title: 'Medical Histories Available',
        amount: String(stats.patientsWithMedicalHistory),
        background: 'bg-light-success',
        border: 'border-success',
        icon: 'rise',
        percentage: `${historyCoverage}%`,
        color: 'text-success',
        number: 'Coverage of assigned patients',
        note: 'Medical histories currently visible'
      },
      {
        title: 'Pending Risk Alerts',
        amount: String(stats.pendingAlerts),
        background: 'bg-light-warning',
        border: 'border-warning',
        icon: 'fall',
        percentage: `${pendingRate}%`,
        color: 'text-warning',
        number: 'Unresolved alerts',
        note: 'Alerts requiring caregiver action'
      },
      {
        title: 'Critical Risk Alerts',
        amount: String(stats.criticalAlerts),
        background: 'bg-light-danger',
        border: 'border-danger',
        icon: 'fall',
        percentage: `${criticalRate}%`,
        color: 'text-danger',
        number: 'Critical unresolved alerts',
        note: 'Highest urgency patient risks'
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

    // Build progression chart
    this.progressionChart = this.buildChart([
      { label: 'Mild', value: stats.mildCases, colorClass: 'bg-primary' },
      { label: 'Moderate', value: stats.moderateCases, colorClass: 'bg-warning' },
      { label: 'Severe', value: stats.severeCases, colorClass: 'bg-danger' }
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
