import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';

// Project import
import tableData from 'src/fake-data/default-data.json';

import { MonthlyBarChartComponent } from 'src/app/theme/shared/apexchart/monthly-bar-chart/monthly-bar-chart.component';
import { IncomeOverviewChartComponent } from 'src/app/theme/shared/apexchart/income-overview-chart/income-overview-chart.component';
import { AnalyticsChartComponent } from 'src/app/theme/shared/apexchart/analytics-chart/analytics-chart.component';
import { SalesReportChartComponent } from 'src/app/theme/shared/apexchart/sales-report-chart/sales-report-chart.component';

// Icons
import { IconService, IconDirective } from '@ant-design/icons-angular';
import { FallOutline, GiftOutline, MessageOutline, RiseOutline, SettingOutline} from '@ant-design/icons-angular/icons';
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
} from '@ant-design/icons-angular/icons';

@Component({ 
  selector: 'app-default',
  imports: [
    CommonModule,
    CardComponent,
    IconDirective,
    MonthlyBarChartComponent,
    IncomeOverviewChartComponent,
    AnalyticsChartComponent,
    SalesReportChartComponent
  ],
  templateUrl: './default.component.html',
  styleUrls: ['./default.component.scss']
})
export class DefaultComponent {
  private iconService = inject(IconService);

  constructor() {
    this.iconService.addIcon(...[RiseOutline, FallOutline, SettingOutline, GiftOutline, MessageOutline,HomeOutline,
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
      BookOutline
    ]);
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
