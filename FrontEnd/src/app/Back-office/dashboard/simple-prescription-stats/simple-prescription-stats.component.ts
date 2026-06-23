import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PrescriptionAnalyticsService } from 'src/app/core/services/prescription-analytics.service';
import { SimpleStats } from 'src/app/core/models/simple-stats.model';

@Component({
  selector: 'app-simple-prescription-stats',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container mt-4">
      <div class="row">
        <div class="col-md-12 mb-4">
          <h2 class="page-title">📊 Prescription Statistics</h2>
        </div>
      </div>

      <div *ngIf="loading" class="text-center py-5">
        <div class="spinner-border text-primary" role="status">
          <span class="visually-hidden">Loading...</span>
        </div>
      </div>

      <div *ngIf="!loading && error" class="alert alert-danger" role="alert">
        <strong>Error:</strong> {{ error }}
      </div>

      <div *ngIf="!loading && stats" class="row">
        <!-- Total Prescriptions Card -->
        <div class="col-md-6 col-lg-3 mb-4">
          <div class="card stat-card h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="stat-icon bg-primary">
                  <i class="ti ti-pill"></i>
                </div>
                <div class="ms-3">
                  <p class="text-muted mb-1">Total Prescriptions</p>
                  <h3 class="mb-0 text-primary">{{ stats.totalPrescriptions }}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Total Patients Card -->
        <div class="col-md-6 col-lg-3 mb-4">
          <div class="card stat-card h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="stat-icon bg-info">
                  <i class="ti ti-users"></i>
                </div>
                <div class="ms-3">
                  <p class="text-muted mb-1">Total Patients</p>
                  <h3 class="mb-0 text-info">{{ stats.totalPatients }}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Total Doctors Card -->
        <div class="col-md-6 col-lg-3 mb-4">
          <div class="card stat-card h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="stat-icon bg-success">
                  <i class="ti ti-stethoscope"></i>
                </div>
                <div class="ms-3">
                  <p class="text-muted mb-1">Healthcare Providers</p>
                  <h3 class="mb-0 text-success">{{ stats.totalDoctors }}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Prescriptions Card -->
        <div class="col-md-6 col-lg-3 mb-4">
          <div class="card stat-card h-100">
            <div class="card-body">
              <div class="d-flex align-items-center">
                <div class="stat-icon bg-warning">
                  <i class="ti ti-calendar"></i>
                </div>
                <div class="ms-3">
                  <p class="text-muted mb-1">Last 7 Days</p>
                  <h3 class="mb-0 text-warning">{{ stats.recentPrescriptions }}</h3>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div *ngIf="!loading && stats" class="row mt-4">
        <div class="col-md-12">
          <div class="card">
            <div class="card-header">
              <h5 class="card-title mb-0">Last Updated</h5>
            </div>
            <div class="card-body">
              <p class="text-muted">{{ stats.lastUpdated | date: 'medium' }}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .stat-card {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.3s ease;
      border: none;
    }

    .stat-card:hover {
      transform: translateY(-5px);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .stat-icon {
      width: 50px;
      height: 50px;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 24px;
    }

    .stat-icon.bg-primary {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .stat-icon.bg-info {
      background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
    }

    .stat-icon.bg-success {
      background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
    }

    .stat-icon.bg-warning {
      background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
    }

    .page-title {
      font-weight: 600;
      color: #333;
      margin-bottom: 2rem;
    }
  `]
})
export class SimplePrescriptionStatsComponent implements OnInit {
  stats: SimpleStats | null = null;
  loading = true;
  error = '';

  constructor(private analyticsService: PrescriptionAnalyticsService) {}

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading = true;
    this.error = '';

    this.analyticsService.getSimpleStats().subscribe({
      next: (data) => {
        this.stats = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('Error loading stats:', err);
        this.error = 'Failed to load prescription statistics. Please try again.';
        this.loading = false;
      }
    });
  }
}
