import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { StatisticsService, PatientStatisticsDTO } from 'src/app/core/services/statistics.service';
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { RiseOutline, FallOutline } from '@ant-design/icons-angular/icons';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';
import { AlertTrendsChartComponent } from 'src/app/theme/shared/apexchart/alert-trends-chart/alert-trends-chart.component';
import { AlertStatusChartComponent } from 'src/app/theme/shared/apexchart/alert-status-chart/alert-status-chart.component';
import { HealthRiskChartComponent } from 'src/app/theme/shared/apexchart/health-risk-chart/health-risk-chart.component';
import { CognitiveAssessmentChartComponent } from 'src/app/theme/shared/apexchart/cognitive-assessment-chart/cognitive-assessment-chart.component';

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
  imports: [
    CommonModule,
    CardComponent,
    IconDirective,
    AlertTrendsChartComponent,
    AlertStatusChartComponent,
    HealthRiskChartComponent,
    CognitiveAssessmentChartComponent
  ],
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

  // Chart data properties
  criticalAlertsCount: number = 0;
  warningAlertsCount: number = 0;
  infoAlertsCount: number = 0;
  resolvedAlertsCount: number = 0;
  pendingAlertsCount: number = 0;

  // New chart data properties
  averageMMSE: number = 0;
  averageFunctionalAssessment: number = 0;
  averageADL: number = 0;
  geneticRiskCount: number = 0;
  smokingCount: number = 0;
  cardiovascularCount: number = 0;
  diabetesCount: number = 0;
  depressionCount: number = 0;
  comorbidityCount: number = 0;
  allergieCount: number = 0;

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
    // Set chart data from backend statistics
    this.criticalAlertsCount = stats.criticalAlerts;
    this.warningAlertsCount = stats.warningAlerts;
    this.infoAlertsCount = stats.infoAlerts;
    this.resolvedAlertsCount = stats.resolvedAlerts;
    this.pendingAlertsCount = stats.pendingAlerts;

    // Set new chart data
    this.averageMMSE = stats.mmse || 0;
    this.averageFunctionalAssessment = stats.functionalAssessment || 0;
    this.averageADL = stats.adl || 0;
    this.comorbidityCount = stats.comorbiditiesCount;
    this.allergieCount = stats.medicationAllergiesCount + stats.foodAllergiesCount + stats.environmentalAllergiesCount;
    this.geneticRiskCount = stats.geneticRisk ? 1 : 0;
    this.smokingCount = stats.smoking ? 1 : 0;
    this.cardiovascularCount = stats.cardiovascularDisease ? 1 : 0;
    this.diabetesCount = stats.diabetes ? 1 : 0;
    this.depressionCount = stats.depression ? 1 : 0;

    const historyCoverage = stats.hasMedicalHistory ? 100 : 0;
    const pendingRate = this.calculatePercent(stats.pendingAlerts, stats.totalAlerts);
    const criticalRate = this.calculatePercent(stats.criticalAlerts, stats.totalAlerts);

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
        percentage: `${pendingRate}%`,
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
        percentage: `${criticalRate}%`,
        color: 'text-danger',
        number: 'Critical unresolved alerts',
        note: 'Highest urgency risks'
      },
      // New cards
      {
        title: 'Health Risk Profile',
        amount: String(stats.totalRiskFactors),
        background: 'bg-light-info',
        border: 'border-info',
        icon: 'rise',
        percentage: stats.totalRiskFactors > 0 ? 'Active' : 'None',
        color: 'text-info',
        number: 'Total risk factors',
        note: 'Comorbidities and allergies count'
      },
      {
        title: 'Cognitive Health',
        amount: String(stats.mmse !== null && stats.mmse !== undefined ? stats.mmse : 'N/A'),
        background: this.getCognitiveBackground(stats.mmse),
        border: this.getCognitiveBorder(stats.mmse),
        icon: 'rise',
        percentage: stats.mmse !== null && stats.mmse !== undefined ? `${Math.round((stats.mmse / 30) * 100)}%` : 'N/A',
        color: this.getCognitiveColor(stats.mmse),
        number: 'MMSE Score',
        note: 'Cognitive assessment (0-30 scale)'
      },
      {
        title: 'Health Conditions',
        amount: String(stats.healthConditionCount),
        background: 'bg-light-warning',
        border: 'border-warning',
        icon: stats.healthConditionCount > 0 ? 'fall' : 'rise',
        percentage: stats.healthConditionCount > 0 ? 'Active' : 'None',
        color: 'text-warning',
        number: 'Chronic conditions',
        note: 'Genetic, cardiovascular, diabetes, etc.'
      },
      {
        title: 'Medical History',
        amount: stats.hasMedicalHistory ? 'Complete' : 'Incomplete',
        background: 'bg-light-success',
        border: 'border-success',
        icon: stats.hasMedicalHistory ? 'rise' : 'fall',
        percentage: `${historyCoverage}%`,
        color: 'text-success',
        number: 'Record status',
        note: 'Medical history coverage'
      }
    ];
  }

  private getCognitiveBackground(mmse: number | null | undefined): string {
    if (mmse === null || mmse === undefined) return 'bg-light-muted';
    if (mmse < 18) return 'bg-light-danger';
    if (mmse < 23) return 'bg-light-warning';
    return 'bg-light-success';
  }

  private getCognitiveBorder(mmse: number | null | undefined): string {
    if (mmse === null || mmse === undefined) return 'border-muted';
    if (mmse < 18) return 'border-danger';
    if (mmse < 23) return 'border-warning';
    return 'border-success';
  }

  private getCognitiveColor(mmse: number | null | undefined): string {
    if (mmse === null || mmse === undefined) return 'text-muted';
    if (mmse < 18) return 'text-danger';
    if (mmse < 23) return 'text-warning';
    return 'text-success';
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
