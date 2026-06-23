import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MonitoringRoutingModule } from './monitoring-routing.module';
import { SharedModule } from '../../theme/shared/shared.module';
import { NgApexchartsModule } from 'ng-apexcharts';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

// Dashboard
import { MonitoringDashboardComponent } from './components/monitoring-dashboard/monitoring-dashboard.component';

// Left Column Components
import { VitalsOverviewComponent } from './components/vitals-overview/vitals-overview.component';
import { CognitiveAssessmentsComponent } from './components/cognitive-assessments/cognitive-assessments.component';
import { SleepActivityTrendsComponent } from './components/sleep-activity-trends/sleep-activity-trends.component';
import { BehaviorLogsComponent } from './components/behavior-logs/behavior-logs.component';
import { NutritionSummaryComponent } from './components/nutrition-summary/nutrition-summary.component';

// Right Panel Components
import { MonitoringPulseComponent } from './components/monitoring-pulse/monitoring-pulse.component';
import { MonitoringAlertsComponent } from './components/monitoring-alerts/monitoring-alerts.component';
import { MonitoringTasksComponent } from './components/monitoring-tasks/monitoring-tasks.component';
import { SleepLogFormComponent } from './components/sleep-log-form/sleep-log-form.component';
import { PatientTaskAssignmentComponent } from './components/patient-task-assignment/patient-task-assignment.component';
import { PatientListComponent } from './components/patient-list/patient-list.component';

@NgModule({
    declarations: [
        MonitoringDashboardComponent,
        PatientListComponent,
        // Left Column
        VitalsOverviewComponent,
        CognitiveAssessmentsComponent,
        SleepActivityTrendsComponent,
        BehaviorLogsComponent,
        NutritionSummaryComponent,
        // Right Panel
        MonitoringPulseComponent,
        MonitoringAlertsComponent,
        MonitoringTasksComponent,
        SleepLogFormComponent,
        PatientTaskAssignmentComponent
    ],
    imports: [
        CommonModule,
        MonitoringRoutingModule,
        SharedModule,
        NgApexchartsModule,
        HttpClientModule,
        FormsModule
    ]
})
export class MonitoringModule { }
