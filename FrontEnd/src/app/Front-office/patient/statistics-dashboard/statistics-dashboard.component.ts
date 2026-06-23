import { Component, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { StatisticsService, PatientStatistics, AssuranceStatistics } from '../../../core/services/statistics.service';

@Component({
  selector: 'app-statistics-dashboard',
  templateUrl: './statistics-dashboard.component.html',
  styleUrls: ['./statistics-dashboard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StatisticsDashboardComponent implements OnInit {

  // Tabs
  activeTab: 'patient' | 'assurance' = 'patient';

  // Patient Statistics
  patientStats: PatientStatistics | null = null;
  patientLoading = false;
  patientError: string | null = null;
  currentPatientId: number = 0;

  // Assurance Statistics
  assuranceStats: AssuranceStatistics | null = null;
  assuranceLoading = false;
  assuranceError: string | null = null;
  currentAssuranceId: number = 0;

  // Chart data
  riskChartData: any = null;
  costChartData: any = null;
  procedureChartData: any = null;

  constructor(
    private statisticsService: StatisticsService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Get IDs from route params or use defaults
    this.route.queryParams.subscribe(params => {
      this.currentPatientId = params['patientId'] || 9; // Default patient ID
      this.currentAssuranceId = params['assuranceId'] || 7; // Default assurance ID
      
      this.loadPatientStatistics();
      this.loadAssuranceStatistics();
    });
  }

  /**
   * Load patient statistics
   */
  loadPatientStatistics(): void {
    if (!this.currentPatientId) return;

    this.patientLoading = true;
    this.patientError = null;

    this.statisticsService.getPatientStatistics(this.currentPatientId).subscribe({
      next: (stats) => {
        this.patientStats = stats;
        this.patientLoading = false;
        this.preparePatientCharts();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading patient statistics:', err);
        this.patientError = 'Failed to load patient statistics. Please try again.';
        this.patientLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Load assurance statistics
   */
  loadAssuranceStatistics(): void {
    if (!this.currentAssuranceId) return;

    this.assuranceLoading = true;
    this.assuranceError = null;

    this.statisticsService.getAssuranceStatistics(this.currentAssuranceId).subscribe({
      next: (stats) => {
        this.assuranceStats = stats;
        this.assuranceLoading = false;
        this.prepareAssuranceCharts();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading assurance statistics:', err);
        this.assuranceError = 'Failed to load assurance statistics. Please try again.';
        this.assuranceLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Prepare chart data for patient stats
   */
  private preparePatientCharts(): void {
    if (!this.patientStats) return;

    // Risk score chart (gauge)
    this.riskChartData = {
      type: 'doughnut',
      labels: ['Alzheimer Risk', 'Safe'],
      datasets: [{
        data: [
          (this.patientStats.averageAlzheimersRisk * 100).toFixed(1),
          (100 - (this.patientStats.averageAlzheimersRisk * 100)).toFixed(1)
        ],
        backgroundColor: ['#dc3545', '#28a745'],
        borderColor: ['#fff', '#fff'],
        borderWidth: 2
      }]
    };

    // Procedure frequency chart
    if (this.patientStats.recommendedProceduresFrequency) {
      const procs = Object.entries(this.patientStats.recommendedProceduresFrequency);
      this.procedureChartData = {
        type: 'bar',
        labels: procs.map(p => p[0]),
        datasets: [{
          label: 'Frequency',
          data: procs.map(p => p[1]),
          backgroundColor: '#007bff',
          borderColor: '#0056b3',
          borderWidth: 1
        }]
      };
    }
  }

  /**
   * Prepare chart data for assurance stats
   */
  private prepareAssuranceCharts(): void {
    if (!this.assuranceStats) return;

    // Risk distribution pie chart
    this.riskChartData = {
      type: 'pie',
      labels: ['High Risk', 'Medium Risk', 'Low Risk'],
      datasets: [{
        data: [
          this.assuranceStats.patientsHighRisk,
          this.assuranceStats.patientsMediumRisk,
          this.assuranceStats.patientsLowRisk
        ],
        backgroundColor: ['#dc3545', '#ffc107', '#28a745'],
        borderColor: ['#fff', '#fff', '#fff'],
        borderWidth: 2
      }]
    };

    // Top procedures chart
    if (this.assuranceStats.topRecommendedProcedures && this.assuranceStats.topRecommendedProcedures.length > 0) {
      this.procedureChartData = {
        type: 'horizontalBar',
        labels: this.assuranceStats.topRecommendedProcedures.map(p => p.procedureName),
        datasets: [{
          label: 'Frequency',
          data: this.assuranceStats.topRecommendedProcedures.map(p => p.frequency),
          backgroundColor: '#17a2b8',
          borderColor: '#0c5460',
          borderWidth: 1
        }]
      };
    }
  }

  /**
   * Get risk level text color
   */
  getRiskLevelClass(level: string): string {
    switch (level?.toUpperCase()) {
      case 'VERY_HIGH':
      case 'HIGH':
        return 'text-danger';
      case 'MODERATE':
        return 'text-warning';
      case 'LOW':
      case 'VERY_LOW':
        return 'text-success';
      default:
        return 'text-secondary';
    }
  }

  /**
   * Get performance rating color
   */
  getPerformanceClass(rating: string): string {
    switch (rating?.toUpperCase()) {
      case 'EXCELLENT':
        return 'badge-success';
      case 'GOOD':
        return 'badge-info';
      case 'AVERAGE':
        return 'badge-warning';
      case 'POOR':
        return 'badge-danger';
      default:
        return 'badge-secondary';
    }
  }

  /**
   * Format currency
   */
  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  }

  /**
   * Format percentage
   */
  formatPercentage(value: number): string {
    return `${(value * 100).toFixed(2)}%`;
  }

  switchTab(tab: 'patient' | 'assurance'): void {
    this.activeTab = tab;
    this.cdr.detectChanges();
  }
}
