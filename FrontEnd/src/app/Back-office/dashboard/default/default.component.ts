import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';

// Project import
import { UserManagementService } from 'src/app/core/services/user-management.service';
import { UserStatsDto } from 'src/app/core/models/user-stats.dto';

import { MonthlyBarChartComponent } from 'src/app/theme/shared/apexchart/monthly-bar-chart/monthly-bar-chart.component';
import { IncomeOverviewChartComponent } from 'src/app/theme/shared/apexchart/income-overview-chart/income-overview-chart.component';
import { AnalyticsChartComponent } from 'src/app/theme/shared/apexchart/analytics-chart/analytics-chart.component';
import { SalesReportChartComponent } from 'src/app/theme/shared/apexchart/sales-report-chart/sales-report-chart.component';
import { NgApexchartsModule } from 'ng-apexcharts';
import type { ApexOptions } from 'apexcharts';

// Icons
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { FallOutline, GiftOutline, MessageOutline, RiseOutline, SettingOutline } from '@ant-design/icons-angular/icons';
import { CardComponent } from 'src/app/theme/shared/components/card/card.component';
import {
  DashboardOutline,
  HomeOutline,
  UserOutline,
  UserAddOutline,
  TeamOutline,
  IdcardOutline,
  LockOutline,
  ScheduleOutline,
  CalendarOutline,
  MedicineBoxOutline,
  FilePdfOutline,
  FileTextOutline,
  BookOutline,
  ReloadOutline,
} from '@ant-design/icons-angular/icons';

const CARD_CONFIG = [
  { title: 'Total Users', key: 'total' as const, percentage: '100%', background: 'bg-light-primary', border: 'border-primary', icon: 'team', color: 'text-primary' },
  { title: 'Patients', key: 'patients' as const, background: 'bg-light-success', border: 'border-success', icon: 'user', color: 'text-success' },
  { title: 'Providers', key: 'providers' as const, background: 'bg-light-warning', border: 'border-warning', icon: 'idcard', color: 'text-warning' },
  { title: 'Caregivers', key: 'caregivers' as const, background: 'bg-light-info', border: 'border-info', icon: 'user-add', color: 'text-info' },
  { title: 'Admins', key: 'admins' as const, background: 'bg-light-secondary', border: 'border-secondary', icon: 'lock', color: 'text-secondary' },
];

@Component({
  selector: 'app-default',
  imports: [
    CommonModule,
    CardComponent,
    IconDirective,
    NgApexchartsModule,
    MonthlyBarChartComponent,
    IncomeOverviewChartComponent,
    AnalyticsChartComponent,
    SalesReportChartComponent
  ],
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss']
})
export class DefaultComponent implements OnInit {
  private iconService = inject(IconService);
  private userManagementService = inject(UserManagementService);
  private cdr = inject(ChangeDetectorRef);

  userStats: UserStatsDto | null = null;
  userStatsLoading = true;
  userStatsError = '';
  lastUpdated: Date | null = null;
  /** Animated display values [total, patients, providers, caregivers, admins] */
  displayAmounts = [0, 0, 0, 0, 0];
  userStatsCards = CARD_CONFIG;
  donutOptions: Partial<ApexOptions> = {};
  readonly skeletonCounts = [0, 1, 2, 3, 4];
  private animationFrameId: ReturnType<typeof setInterval> | null = null;

  constructor() {
    this.iconService.addIcon(...[RiseOutline, FallOutline, SettingOutline, GiftOutline, MessageOutline, HomeOutline,
      DashboardOutline, HomeOutline, UserOutline, UserAddOutline, TeamOutline, IdcardOutline, LockOutline,
      ScheduleOutline, CalendarOutline, MedicineBoxOutline, FilePdfOutline, FileTextOutline, BookOutline, ReloadOutline
    ]);
  }

  ngOnInit(): void {
    this.loadUserStats();
  }

  loadUserStats(): void {
    this.userStatsError = '';
    this.userStatsLoading = true;
    this.cdr.markForCheck();
    this.userManagementService.getStats().subscribe({
      next: (stats) => {
        setTimeout(() => {
          this.userStats = stats;
          this.userStatsLoading = false;
          this.userStatsError = '';
          this.lastUpdated = new Date();
          this.buildDonutOptions(stats);
          this.animateCounters(stats);
          this.cdr.markForCheck();
        }, 0);
      },
      error: () => {
        setTimeout(() => {
          this.userStatsLoading = false;
          this.userStatsError = 'Failed to load user statistics.';
          this.cdr.markForCheck();
        }, 0);
      }
    });
  }

  refreshStats(): void {
    if (this.userStatsLoading) return;
    this.loadUserStats();
  }

  private animateCounters(s: UserStatsDto): void {
    const targets = [s.total, s.patients, s.providers, s.caregivers, s.admins];
    const duration = 800;
    const steps = 20;
    const stepMs = duration / steps;
    let step = 0;
    if (this.animationFrameId) clearInterval(this.animationFrameId);
    this.animationFrameId = setInterval(() => {
      step++;
      for (let i = 0; i < 5; i++) {
        const t = targets[i];
        this.displayAmounts[i] = step >= steps ? t : Math.round(this.displayAmounts[i] + (t - this.displayAmounts[i]) * 0.25);
      }
      this.cdr.markForCheck();
      if (step >= steps) {
        if (this.animationFrameId) clearInterval(this.animationFrameId);
        this.animationFrameId = null;
      }
    }, stepMs);
  }

  private buildDonutOptions(s: UserStatsDto): void {
    const total = s.total || 1;
    this.donutOptions = {
      chart: {
        type: 'donut',
        height: 280,
        background: 'transparent',
        fontFamily: 'inherit',
      },
      series: [s.patients, s.providers, s.caregivers, s.admins],
      labels: ['Patients', 'Providers', 'Caregivers', 'Admins'],
      colors: ['#22c55e', '#eab308', '#3b82f6', '#64748b'],
      stroke: {
        show: true,
        width: 2,
        colors: ['#fff'],
      },
      dataLabels: {
        enabled: true,
        style: { fontSize: '11px' },
        formatter: (val: number) => (val > 0 ? Math.round(val) + '%' : ''),
      },
      plotOptions: {
        pie: {
          donut: {
            size: '70%',
            background: 'transparent',
            labels: {
              show: true,
              name: { show: true, fontSize: '13px', color: '#6b7280' },
              value: { show: true, fontSize: '20px', fontWeight: 700, color: '#1f2937' },
              total: {
                show: true,
                label: 'Total users',
                fontSize: '12px',
                color: '#9ca3af',
                formatter: () => String(s.total),
              },
            },
          },
        },
      },
      legend: {
        position: 'bottom',
        horizontalAlign: 'center',
        fontSize: '12px',
        fontWeight: 500,
        markers: { size: 6 },
        itemMargin: { horizontal: 10, vertical: 6 },
      },
      tooltip: {
        theme: 'light',
        y: { formatter: (v: number) => `${v} user${v !== 1 ? 's' : ''} (${Math.round((v / total) * 100)}%)` },
      },
    };
  }

  getCardPercentage(index: number): string {
    if (!this.userStats || !this.userStats.total) return '—';
    const v = this.displayAmounts[index];
    const total = this.userStats.total;
    return index === 0 ? '100%' : Math.round((v / total) * 100) + '%';
  }

  getCardSubtitle(index: number): string {
    if (!this.userStats) return '';
    if (index === 0) return `${this.userStats.total} users in platform`;
    const pct = this.userStats.total ? Math.round((this.displayAmounts[index] / this.userStats.total) * 100) : 0;
    return `${pct}% of all users`;
  }

  get patientsPerProvider(): string {
    if (!this.userStats || !this.userStats.providers) return '—';
    const n = this.userStats.patients / this.userStats.providers;
    return n % 1 === 0 ? String(n) : n.toFixed(1);
  }

  get patientsPerCaregiver(): string {
    if (!this.userStats || !this.userStats.caregivers) return '—';
    const n = this.userStats.patients / this.userStats.caregivers;
    return n % 1 === 0 ? String(n) : n.toFixed(1);
  }

  get largestGroup(): { name: string; count: number } | null {
    if (!this.userStats) return null;
    const entries = [
      { name: 'Patients', count: this.userStats.patients },
      { name: 'Providers', count: this.userStats.providers },
      { name: 'Caregivers', count: this.userStats.caregivers },
      { name: 'Admins', count: this.userStats.admins },
    ];
    const max = entries.reduce((a, b) => a.count >= b.count ? a : b);
    return max.count > 0 ? max : null;
  }

  get lastUpdatedText(): string {
    if (!this.lastUpdated) return '';
    const sec = Math.round((Date.now() - this.lastUpdated.getTime()) / 1000);
    if (sec < 10) return 'Just now';
    if (sec < 60) return `${sec}s ago`;
    return this.lastUpdated.toLocaleTimeString();
  }

  // Fake Data for Alzheimer's Application Analytics and Transactions

  recentOrder = [
    { id: 'ORD1234', name: 'Alzheimer’s Medication 1', status: 'Delivered', status_type: 'success', quantity: 3, amount: '$450' },
    { id: 'ORD5678', name: 'Alzheimer’s Medication 2', status: 'Pending', status_type: 'warning', quantity: 2, amount: '$320' },
    { id: 'ORD91011', name: 'Monitoring Device', status: 'Shipped', status_type: 'info', quantity: 1, amount: '$100' },
  ];

  AnalyticEcommerce = [
    {
      title: 'Total Patient Visits',
      amount: '1,20,000',
      background: 'bg-light-primary ',
      border: 'border-primary',
      icon: 'rise',
      percentage: '30%',
      color: 'text-primary',
      number: '35,000'
    },
    {
      title: 'Total Active Patients',
      amount: '45,000',
      background: 'bg-light-success ',
      border: 'border-success',
      icon: 'rise',
      percentage: '25%',
      color: 'text-success',
      number: '8,900'
    },
    {
      title: 'Medications Delivered',
      amount: '20,000',
      background: 'bg-light-warning ',
      border: 'border-warning',
      icon: 'fall',
      percentage: '60%',
      color: 'text-warning',
      number: '15,000'
    },
    {
      title: 'Monitoring Devices Issued',
      amount: '12,000',
      background: 'bg-light-info ',
      border: 'border-info',
      icon: 'rise',
      percentage: '50%',
      color: 'text-info',
      number: '6,500'
    }
  ];

  transaction = [
    {
      background: 'text-success bg-light-success',
      icon: 'gift',
      title: 'Patient #112233 Medication Order',
      time: 'Today, 2:00 AM',
      amount: '+ $150',
      percentage: '78%'
    },
    {
      background: 'text-primary bg-light-primary',
      icon: 'message',
      title: 'Patient #445566 Medication Order',
      time: '5 August, 1:45 PM',
      amount: '- $180',
      percentage: '8%'
    },
    {
      background: 'text-danger bg-light-danger',
      icon: 'setting',
      title: 'Patient #778899 Monitoring Device',
      time: '7 hours ago',
      amount: '- $320',
      percentage: '16%'
    }
  ];
}
